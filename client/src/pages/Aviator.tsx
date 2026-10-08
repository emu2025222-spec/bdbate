import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Clock3,
  History,
  Plane,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import {
  api,
  cashOutAviator,
  getAviatorHistory,
  getAviatorRoundStatus,
  startAviatorRound,
} from "../services/api";

type GameStatus =
  | "RUNNING"
  | "WAITING"
  | "CRASHED";

interface HistoryItem {
  roundNumber: number;
  multiplier: number;
  crashedAt?: string;
}

interface RoundData {
  _id: string;
  id?: string;
  roundNumber: number;
  status: "RUNNING" | "CRASHED";
  startedAt: string;
  crashedAt?: string;
}

interface CurrentRoundResponse {
  status: "RUNNING" | "WAITING";
  multiplier: number;
  countdownMs?: number;
  round: RoundData | null;
}

interface AviatorStartResponse {
  balance?: number;
  queued?: boolean;
  round?: Partial<RoundData> | null;
}

interface LocalBet {
  amount: number;
  roundId: string | null;
  roundNumber: number | null;
  queued: boolean;
  active: boolean;
  cashedOut: boolean;
  payout: number;
  cashoutMultiplier: number;
}

const SERVER_SYNC_MS = 350;
const CURRENT_SYNC_MS = 300;

function calculateClientMultiplier(
  startedAt: string
): number {
  const elapsed =
    Math.max(
      0,
      Date.now() -
        new Date(startedAt).getTime()
    ) / 1000;

  const multiplier =
    1 +
    elapsed * 0.18 +
    elapsed * elapsed * 0.018;

  return Number(
    multiplier.toFixed(2)
  );
}

function formatCountdown(
  milliseconds: number
) {
  const seconds =
    Math.max(
      0,
      milliseconds
    ) / 1000;

  return seconds.toFixed(1);
}

export default function Aviator() {
  const [balance, setBalance] =
    useState<number>(0);

  const [betAmount, setBetAmount] =
    useState("10");

  /*
   * Auto cashout target.
   * Auto cashout itself is OFF by default.
   */
  const [autoCashout, setAutoCashout] =
    useState("2.00");

  const [
    autoCashoutEnabled,
    setAutoCashoutEnabled,
  ] = useState(false);

  const [status, setStatus] =
    useState<GameStatus>("WAITING");

  const [displayMultiplier, setDisplayMultiplier] =
    useState(1);

  const [serverMultiplier, setServerMultiplier] =
    useState(1);

  const [countdownMs, setCountdownMs] =
    useState(10000);

  const [roundNumber, setRoundNumber] =
    useState<number | null>(null);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [message, setMessage] =
    useState(
      "Waiting for the next round..."
    );

  const [loading, setLoading] =
    useState(false);

  const [cashoutLoading, setCashoutLoading] =
    useState(false);

  const [bet, setBet] =
    useState<LocalBet>({
      amount: 0,
      roundId: null,
      roundNumber: null,
      queued: false,
      active: false,
      cashedOut: false,
      payout: 0,
      cashoutMultiplier: 0,
    });

  const animationRef =
    useRef<number | null>(null);

  const currentPollRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const roundPollRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const countdownRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const currentRoundIdRef =
    useRef<string | null>(null);

  const startedAtRef =
    useRef<string | null>(null);

  const statusRef =
    useRef<GameStatus>("WAITING");

  const serverMultiplierRef =
    useRef(1);

  const displayMultiplierRef =
    useRef(1);

  const betRef =
    useRef<LocalBet>(bet);

  const autoCashoutRef =
    useRef(autoCashout);

  const autoCashoutEnabledRef =
    useRef(false);

  const countdownEndRef =
    useRef<number | null>(null);

  const autoCashoutTriggeredRef =
    useRef(false);

  useEffect(() => {
    betRef.current = bet;
  }, [bet]);

  useEffect(() => {
    autoCashoutRef.current =
      autoCashout;
  }, [autoCashout]);

  useEffect(() => {
    autoCashoutEnabledRef.current =
      autoCashoutEnabled;
  }, [autoCashoutEnabled]);

  useEffect(() => {
    statusRef.current =
      status;
  }, [status]);

  useEffect(() => {
    serverMultiplierRef.current =
      serverMultiplier;
  }, [serverMultiplier]);

  /*
   * --------------------------------------------------------
   * BALANCE
   * --------------------------------------------------------
   */

  const loadBalance =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/wallet/balance"
          );

        const nextBalance =
          Number(
            response.data?.balance ??
              response.data?.user
                ?.balance ??
              0
          );

        if (
          Number.isFinite(nextBalance)
        ) {
          setBalance(
            nextBalance
          );
        }
      } catch (error) {
        console.error(
          "Balance load error:",
          error
        );
      }
    }, []);

  /*
   * --------------------------------------------------------
   * HISTORY
   * --------------------------------------------------------
   */

  const loadHistory =
    useCallback(async () => {
      try {
        const response =
          await getAviatorHistory();

        setHistory(
          Array.isArray(
            response?.history
          )
            ? response.history
            : []
        );
      } catch (error: any) {
        console.error(
          "Aviator history error:",
          error?.response?.data ??
            error
        );
      }
    }, []);

  /*
   * --------------------------------------------------------
   * ANIMATION
   * --------------------------------------------------------
   */

  const stopAnimation =
    useCallback(() => {
      if (
        animationRef.current !== null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }
    }, []);

  const startAnimation =
    useCallback(() => {
      stopAnimation();

      const animate =
        () => {
          if (
            statusRef.current !==
              "RUNNING" ||
            !startedAtRef.current
          ) {
            animationRef.current =
              null;

            return;
          }

          const calculated =
            calculateClientMultiplier(
              startedAtRef.current
            );

          const target =
            Math.max(
              calculated,
              serverMultiplierRef.current
            );

          const current =
            displayMultiplierRef.current;

          const difference =
            target - current;

          let next =
            current +
            difference * 0.16;

          if (
            Math.abs(
              difference
            ) < 0.005
          ) {
            next = target;
          }

          next =
            Math.max(
              current,
              next
            );

          displayMultiplierRef.current =
            next;

          setDisplayMultiplier(
            Number(
              next.toFixed(2)
            )
          );

          animationRef.current =
            requestAnimationFrame(
              animate
            );
        };

      animationRef.current =
        requestAnimationFrame(
          animate
        );
    }, [stopAnimation]);

  /*
   * --------------------------------------------------------
   * COUNTDOWN
   * --------------------------------------------------------
   */

  const stopCountdown =
    useCallback(() => {
      if (
        countdownRef.current !== null
      ) {
        clearInterval(
          countdownRef.current
        );

        countdownRef.current =
          null;
      }
    }, []);

  const startCountdown =
    useCallback(
      (milliseconds: number) => {
        stopCountdown();

        const safeMs =
          Math.max(
            0,
            Number(milliseconds) || 0
          );

        countdownEndRef.current =
          Date.now() + safeMs;

        setCountdownMs(
          safeMs
        );

        countdownRef.current =
          setInterval(() => {
            if (
              countdownEndRef.current ===
              null
            ) {
              return;
            }

            const remaining =
              Math.max(
                0,
                countdownEndRef.current -
                  Date.now()
              );

            setCountdownMs(
              remaining
            );

            if (
              remaining <= 0
            ) {
              stopCountdown();
            }
          }, 50);
      },
      [stopCountdown]
    );

  /*
   * --------------------------------------------------------
   * CURRENT ROUND
   * --------------------------------------------------------
   */

  const syncCurrentRound =
    useCallback(
      async () => {
        try {
          const response =
            await api.get<CurrentRoundResponse>(
              "/game/aviator/current"
            );

          const data =
            response.data;

          if (
            data.status ===
              "WAITING" ||
            !data.round
          ) {
            stopAnimation();

            statusRef.current =
              "WAITING";

            setStatus(
              "WAITING"
            );

            currentRoundIdRef.current =
              null;

            setRoundNumber(
              null
            );

            startedAtRef.current =
              null;

            setDisplayMultiplier(
              1
            );

            displayMultiplierRef.current =
              1;

            setServerMultiplier(
              1
            );

            serverMultiplierRef.current =
              1;

            autoCashoutTriggeredRef.current =
              false;

            const wait =
              Math.max(
                0,
                Number(
                  data.countdownMs ??
                    10000
                )
              );

            startCountdown(
              wait
            );

            if (
              betRef.current.queued
            ) {
              setMessage(
                "Your bet is queued for the next round."
              );
            } else {
              setMessage(
                "Betting is open for the next round."
              );
            }

            return;
          }

          const round =
            data.round;

          const resolvedRoundId =
            String(
              round._id ??
                round.id ??
                ""
            );

          if (
            !resolvedRoundId
          ) {
            console.error(
              "Aviator round has no ID:",
              round
            );

            return;
          }

          const newRound =
            currentRoundIdRef.current !==
            resolvedRoundId;

          currentRoundIdRef.current =
            resolvedRoundId;

          startedAtRef.current =
            round.startedAt;

          setRoundNumber(
            Number(
              round.roundNumber
            )
          );

          statusRef.current =
            "RUNNING";

          setStatus(
            "RUNNING"
          );

          stopCountdown();

          const confirmedMultiplier =
            Number(
              data.multiplier || 1
            );

          serverMultiplierRef.current =
            confirmedMultiplier;

          setServerMultiplier(
            confirmedMultiplier
          );

          /*
           * Queued bet becomes active
           * when the next round starts.
           */
          if (
            newRound &&
            betRef.current.queued &&
            !betRef.current.cashedOut
          ) {
            setBet(
              (previous) => ({
                ...previous,
                roundId:
                  resolvedRoundId,
                roundNumber:
                  round.roundNumber,
                queued: false,
                active: true,
              })
            );

            setMessage(
              `Bet is active on Round #${round.roundNumber}.`
            );
          } else if (
            !betRef.current.active &&
            !betRef.current.queued
          ) {
            setMessage(
              `Round #${round.roundNumber} is running.`
            );
          }

          if (
            newRound
          ) {
            displayMultiplierRef.current =
              Math.max(
                1,
                confirmedMultiplier
              );

            setDisplayMultiplier(
              Math.max(
                1,
                confirmedMultiplier
              )
            );

            autoCashoutTriggeredRef.current =
              false;
          }

          startAnimation();
        } catch (error: any) {
          console.error(
            "Current round sync error:",
            error?.response?.data ??
              error
          );
        }
      },
      [
        startAnimation,
        startCountdown,
        stopAnimation,
        stopCountdown,
      ]
    );

  /*
   * --------------------------------------------------------
   * CASHOUT
   * --------------------------------------------------------
   */

  async function performCashout(
    targetRoundId: string,
    automatic = false
  ) {
    if (
      cashoutLoading ||
      !betRef.current.active ||
      betRef.current.cashedOut
    ) {
      return;
    }

    setCashoutLoading(
      true
    );

    try {
      const response =
        await cashOutAviator(
          targetRoundId
        );

      const payout =
        Number(
          response?.payout || 0
        );

      const finalMultiplier =
        Number(
          response?.multiplier ||
            displayMultiplierRef.current
        );

      const returnedBalance =
        Number(
          response?.balance
        );

      if (
        Number.isFinite(
          returnedBalance
        )
      ) {
        setBalance(
          returnedBalance
        );
      } else {
        setBalance(
          (previous) =>
            previous + payout
        );
      }

      setBet(
        (previous) => ({
          ...previous,
          active: false,
          queued: false,
          cashedOut: true,
          payout,
          cashoutMultiplier:
            finalMultiplier,
        })
      );

      setMessage(
        automatic
          ? `Auto cashout at ${finalMultiplier.toFixed(
              2
            )}x — +${payout.toFixed(
              2
            )}`
          : `Cashed out at ${finalMultiplier.toFixed(
              2
            )}x — +${payout.toFixed(
              2
            )}`
      );

      await loadBalance();
    } catch (error: any) {
      console.error(
        "Aviator cashout error:",
        error
      );

      const apiMessage =
        error?.response?.data
          ?.message;

      setMessage(
        apiMessage ||
          "Cashout failed."
      );

      if (
        automatic
      ) {
        autoCashoutTriggeredRef.current =
          false;
      }
    } finally {
      setCashoutLoading(
        false
      );
    }
  }

  /*
   * --------------------------------------------------------
   * ROUND STATUS
   * --------------------------------------------------------
   */

  const syncRoundStatus =
    useCallback(
      async () => {
        const activeRoundId =
          currentRoundIdRef.current;

        if (
          !activeRoundId ||
          statusRef.current !==
            "RUNNING"
        ) {
          return;
        }

        try {
          const data =
            await getAviatorRoundStatus(
              activeRoundId
            );

          if (
            data.status ===
            "RUNNING"
          ) {
            const confirmed =
              Number(
                data.multiplier || 1
              );

            serverMultiplierRef.current =
              confirmed;

            setServerMultiplier(
              confirmed
            );

            if (
              displayMultiplierRef.current <
              confirmed
            ) {
              displayMultiplierRef.current =
                confirmed;

              setDisplayMultiplier(
                Number(
                  confirmed.toFixed(
                    2
                  )
                )
              );
            }

            /*
             * AUTO CASHOUT
             *
             * This only runs when the
             * player explicitly enabled
             * Auto Cashout.
             */
            const autoValue =
              Number(
                autoCashoutRef.current
              );

            const playerBet =
              betRef.current;

            if (
              autoCashoutEnabledRef.current &&
              playerBet.active &&
              !playerBet.cashedOut &&
              Number.isFinite(
                autoValue
              ) &&
              autoValue > 1 &&
              confirmed >=
                autoValue &&
              !autoCashoutTriggeredRef.current
            ) {
              autoCashoutTriggeredRef.current =
                true;

              void performCashout(
                activeRoundId,
                true
              );
            }

            return;
          }

          /*
           * ------------------------------------------------
           * ROUND CRASHED
           * ------------------------------------------------
           */

          stopAnimation();

          statusRef.current =
            "CRASHED";

          setStatus(
            "CRASHED"
          );

          const crashMultiplier =
            Number(
              data.multiplier ||
                displayMultiplierRef.current
            );

          setDisplayMultiplier(
            crashMultiplier
          );

          displayMultiplierRef.current =
            crashMultiplier;

          setServerMultiplier(
            crashMultiplier
          );

          serverMultiplierRef.current =
            crashMultiplier;

          setMessage(
            `Round crashed at ${crashMultiplier.toFixed(
              2
            )}x`
          );

          if (
            betRef.current.active &&
            !betRef.current.cashedOut
          ) {
            setBet(
              (previous) => ({
                ...previous,
                active: false,
              })
            );
          }

          autoCashoutTriggeredRef.current =
            false;

          startCountdown(
            10000
          );

          await loadHistory();

          window.setTimeout(
            () => {
              void syncCurrentRound();
            },
            350
          );
        } catch (error: any) {
          console.error(
            "Round status error:",
            error?.response?.data ??
              error
          );
        }
      },
      [
        loadHistory,
        startCountdown,
        stopAnimation,
        syncCurrentRound,
      ]
    );

  /*
   * --------------------------------------------------------
   * PLACE BET
   * --------------------------------------------------------
   */

  const handleBet =
    async () => {
      if (loading) {
        return;
      }

      const amount =
        Number(
          String(
            betAmount
          ).trim()
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        setMessage(
          "Enter a valid bet amount."
        );

        return;
      }

      if (
        amount < 10
      ) {
        setMessage(
          "Minimum bet is 10 credits."
        );

        return;
      }

      if (
        amount > 10000
      ) {
        setMessage(
          "Maximum bet is 10,000 credits."
        );

        return;
      }

      if (
        amount >
        Number(balance)
      ) {
        setMessage(
          `Insufficient balance. Available: ${Number(
            balance
          ).toFixed(
            2
          )} credits.`
        );

        return;
      }

      if (
        betRef.current.active
      ) {
        setMessage(
          "You already have an active bet."
        );

        return;
      }

      if (
        betRef.current.queued
      ) {
        setMessage(
          "You already have a bet queued for the next round."
        );

        return;
      }

      /*
       * Validate auto cashout only
       * when it is enabled.
       */
      if (
        autoCashoutEnabled
      ) {
        const autoValue =
          Number(
            autoCashout
          );

        if (
          !Number.isFinite(
            autoValue
          ) ||
          autoValue <= 1
        ) {
          setMessage(
            "Enter a valid auto cashout value above 1.00x."
          );

          return;
        }
      }

      setLoading(true);

      try {
        console.log(
          "Aviator bet request:",
          amount
        );

        const response =
          (await startAviatorRound(
            amount
          )) as AviatorStartResponse;

        console.log(
          "Aviator bet response:",
          response
        );

        if (
          !response
        ) {
          throw new Error(
            "Empty response from server."
          );
        }

        const nextBalance =
          Number(
            response.balance
          );

        if (
          Number.isFinite(
            nextBalance
          )
        ) {
          setBalance(
            nextBalance
          );
        } else {
          setBalance(
            (previous) =>
              previous - amount
          );
        }

        const queued =
          response.queued ===
          true;

        const nextRound =
          response.round;

        /*
         * QUEUED FOR NEXT ROUND
         */

        if (
          queued
        ) {
          setBet({
            amount,
            roundId: null,
            roundNumber: null,
            queued: true,
            active: false,
            cashedOut: false,
            payout: 0,
            cashoutMultiplier: 0,
          });

          setMessage(
            "Bet accepted. Your bet is queued for the next round."
          );

          console.log(
            "Aviator bet queued:",
            {
              amount,
              round:
                nextRound,
            }
          );

          await loadBalance();

          return;
        }

        /*
         * SERVER ACCEPTED BET BUT
         * DID NOT RETURN ROUND ID
         */

        const responseRoundId =
          nextRound?.id;

        if (
          !responseRoundId
        ) {
          console.error(
            "Server accepted bet but did not return round:",
            response
          );

          setBet({
            amount,
            roundId: null,
            roundNumber:
              nextRound?.roundNumber ??
              null,
            queued: true,
            active: false,
            cashedOut: false,
            payout: 0,
            cashoutMultiplier: 0,
          });

          setMessage(
            "Bet accepted. Waiting for the round to start..."
          );

          await loadBalance();

          return;
        }

        const nextRoundId =
          String(
            responseRoundId
          );

        const nextRoundNumber =
          Number(
            nextRound?.roundNumber
          );

        setBet({
          amount,
          roundId:
            nextRoundId,
          roundNumber:
            Number.isFinite(
              nextRoundNumber
            )
              ? nextRoundNumber
              : null,
          queued: false,
          active: true,
          cashedOut: false,
          payout: 0,
          cashoutMultiplier: 0,
        });

        currentRoundIdRef.current =
          nextRoundId;

        if (
          nextRound?.startedAt
        ) {
          startedAtRef.current =
            nextRound.startedAt;
        }

        if (
          Number.isFinite(
            nextRoundNumber
          )
        ) {
          setRoundNumber(
            nextRoundNumber
          );
        }

        setMessage(
          Number.isFinite(
            nextRoundNumber
          )
            ? `Bet placed successfully on Round #${nextRoundNumber}.`
            : "Bet placed successfully."
        );

        console.log(
          "Aviator bet accepted:",
          {
            amount,
            roundId:
              nextRoundId,
            roundNumber:
              nextRoundNumber,
          }
        );

        await loadBalance();

        await syncCurrentRound();
      } catch (error: any) {
        console.error(
          "Aviator bet error:",
          error
        );

        const statusCode =
          error?.response?.status;

        const serverMessage =
          error?.response?.data
            ?.message;

        if (
          statusCode ===
          401
        ) {
          setMessage(
            "Session expired. Please logout and login again."
          );
        } else if (
          statusCode ===
          400
        ) {
          setMessage(
            serverMessage ||
              "Bet could not be placed."
          );
        } else if (
          statusCode ===
          503
        ) {
          setMessage(
            serverMessage ||
              "Round is starting. Please try again."
          );
        } else {
          setMessage(
            serverMessage ||
              error?.message ||
              "Could not place the bet."
          );
        }
      } finally {
        setLoading(
          false
        );
      }
    };

  /*
   * --------------------------------------------------------
   * MANUAL CASHOUT
   * --------------------------------------------------------
   */

  const handleCashout =
    async () => {
      const activeRound =
        currentRoundIdRef.current;

      if (
        !activeRound
      ) {
        setMessage(
          "No active round found."
        );

        return;
      }

      await performCashout(
        activeRound,
        false
      );
    };

  /*
   * --------------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------------
   */

  useEffect(() => {
    void loadBalance();
    void loadHistory();
    void syncCurrentRound();

    return () => {
      stopAnimation();
      stopCountdown();

      if (
        currentPollRef.current
      ) {
        clearInterval(
          currentPollRef.current
        );

        currentPollRef.current =
          null;
      }

      if (
        roundPollRef.current
      ) {
        clearInterval(
          roundPollRef.current
        );

        roundPollRef.current =
          null;
      }
    };
  }, [
    loadBalance,
    loadHistory,
    syncCurrentRound,
    stopAnimation,
    stopCountdown,
  ]);

  /*
   * --------------------------------------------------------
   * CURRENT ROUND POLL
   * --------------------------------------------------------
   */

  useEffect(() => {
    currentPollRef.current =
      setInterval(() => {
        if (
          statusRef.current !==
          "RUNNING"
        ) {
          void syncCurrentRound();
        }
      }, CURRENT_SYNC_MS);

    return () => {
      if (
        currentPollRef.current
      ) {
        clearInterval(
          currentPollRef.current
        );

        currentPollRef.current =
          null;
      }
    };
  }, [
    syncCurrentRound,
  ]);

  /*
   * --------------------------------------------------------
   * RUNNING ROUND POLL
   * --------------------------------------------------------
   */

  useEffect(() => {
    roundPollRef.current =
      setInterval(() => {
        if (
          statusRef.current ===
          "RUNNING"
        ) {
          void syncRoundStatus();
        }
      }, SERVER_SYNC_MS);

    return () => {
      if (
        roundPollRef.current
      ) {
        clearInterval(
          roundPollRef.current
        );

        roundPollRef.current =
          null;
      }
    };
  }, [
    syncRoundStatus,
  ]);

  /*
   * --------------------------------------------------------
   * GRAPH
   * --------------------------------------------------------
   */

  const graphPoints =
    useMemo(() => {
      const multiplier =
        Math.max(
          1,
          displayMultiplier
        );

      const progress =
        Math.min(
          1,
          Math.log(
            multiplier
          ) /
            Math.log(10)
        );

      const points: string[] =
        [];

      const count = 48;

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const x =
          (i /
            (count - 1)) *
          100;

        const base =
          94 -
          Math.pow(
            i /
              (count - 1),
            1.75
          ) *
            72 *
            Math.min(
              1,
              progress + 0.12
            );

        const wave =
          Math.sin(
            i * 0.55
          ) *
          1.4;

        const y =
          Math.max(
            12,
            Math.min(
              94,
              base + wave
            )
          );

        points.push(
          `${x.toFixed(
            2
          )},${y.toFixed(2)}`
        );
      }

      return points.join(
        " "
      );
    }, [
      displayMultiplier,
    ]);

  /*
   * --------------------------------------------------------
   * PLANE POSITION
   * --------------------------------------------------------
   */

  const planePosition =
    useMemo(() => {
      const multiplier =
        Math.max(
          1,
          displayMultiplier
        );

      const progress =
        Math.min(
          1,
          Math.log(
            multiplier
          ) /
            Math.log(12)
        );

      const left =
        8 +
        progress * 78;

      const bottom =
        10 +
        Math.pow(
          progress,
          1.45
        ) *
          62;

      return {
        left: `${left}%`,
        bottom: `${bottom}%`,
      };
    }, [
      displayMultiplier,
    ]);

  /*
   * --------------------------------------------------------
   * UI STATE
   * --------------------------------------------------------
   */

  const isRunning =
    status === "RUNNING";

  const isWaiting =
    status === "WAITING";

  const hasActiveBet =
    bet.active &&
    !bet.cashedOut;

  const hasQueuedBet =
    bet.queued &&
    !bet.cashedOut;

  const canCashout =
    isRunning &&
    hasActiveBet &&
    !cashoutLoading;

  const displayBalance =
    Number(
      balance || 0
    ).toFixed(2);

  const parsedAutoCashout =
    Number(
      autoCashout
    );

  const validAutoCashout =
    Number.isFinite(
      parsedAutoCashout
    ) &&
    parsedAutoCashout > 1;

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1500px] px-3 pb-10 pt-4 sm:px-5 lg:px-8">

        {/* Back */}
        <div className="mb-4">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Games
          </Link>
        </div>

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <Plane size={17} />
              </div>

              <span className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">
                Live Game
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Aviator
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Join before the flight starts,
              then cash out before the crash.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Wallet
              size={18}
              className="text-emerald-400"
            />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Balance
              </p>

              <p className="text-base font-bold">
                {displayBalance}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadBalance()
              }
              className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              title="Refresh balance"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* GAME */}
          <section className="min-w-0">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1728] shadow-2xl shadow-black/30">

              {/* Round bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      isRunning
                        ? "animate-pulse bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                  />

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Round
                    </p>

                    <p className="text-sm font-bold text-white">
                      {roundNumber
                        ? `#${roundNumber}`
                        : "Next Round"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock3
                    size={15}
                    className="text-slate-500"
                  />

                  <span className="text-xs font-medium text-slate-400">
                    {isRunning
                      ? "Flight live"
                      : "Betting open"}
                  </span>
                </div>
              </div>

              {/* GAME CANVAS */}
              <div className="relative h-[390px] overflow-hidden bg-[radial-gradient(circle_at_72%_30%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,#0b1728,#07111f)] sm:h-[480px]">

                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.055]">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
                      backgroundSize:
                        "55px 55px",
                    }}
                  />
                </div>

                {/* Glow */}
                <div className="absolute left-1/2 top-1/3 h-52 w-52 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />

                {/* Multiplier */}
                <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 text-center sm:top-10">
                  {isWaiting ? (
                    <>
                      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400">
                        Next round starts in
                      </p>

                      <div className="mt-1 text-5xl font-black tabular-nums tracking-tight text-white drop-shadow-2xl sm:text-6xl">
                        {formatCountdown(
                          countdownMs
                        )}

                        <span className="ml-1 text-xl text-slate-500">
                          s
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                        Current multiplier
                      </p>

                      <div
                        className={`mt-1 text-6xl font-black tabular-nums tracking-tight sm:text-8xl ${
                          status ===
                          "CRASHED"
                            ? "text-red-400"
                            : "text-white"
                        }`}
                      >
                        {displayMultiplier.toFixed(
                          2
                        )}

                        <span className="ml-1 text-2xl text-slate-500 sm:text-3xl">
                          x
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* SVG */}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                >
                  <defs>
                    <linearGradient
                      id="flightGradient"
                      x1="0"
                      x2="1"
                      y1="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#ef4444"
                        stopOpacity="0.04"
                      />

                      <stop
                        offset="100%"
                        stopColor="#ef4444"
                        stopOpacity="0.38"
                      />
                    </linearGradient>
                  </defs>

                  <polygon
                    points={`0,100 ${graphPoints} 100,100`}
                    fill="url(#flightGradient)"
                  />

                  {isRunning && (
                    <polyline
                      points={
                        graphPoints
                      }
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="0.8"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>

                {/* Plane */}
                {isRunning && (
                  <div
                    className="absolute z-20 transition-none"
                    style={{
                      left:
                        planePosition.left,
                      bottom:
                        planePosition.bottom,
                      transform:
                        "translate(-50%, 50%)",
                    }}
                  >
                    <div className="relative">
                      <div className="absolute -inset-5 rounded-full bg-red-500/10 blur-xl" />

                      <div className="relative flex h-12 w-12 rotate-[-12deg] items-center justify-center rounded-full bg-red-500/10 sm:h-14 sm:w-14">
                        <Plane
                          size={28}
                          strokeWidth={2.2}
                          className="text-red-400 drop-shadow-[0_0_14px_rgba(248,113,113,0.7)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Crash */}
                {status ===
                  "CRASHED" && (
                  <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300">
                      <XCircle size={15} />
                      Crashed
                    </div>

                    <div className="text-4xl font-black text-red-400 sm:text-5xl">
                      {displayMultiplier.toFixed(
                        2
                      )}
                      x
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      Next round in{" "}
                      <span className="font-bold text-white">
                        {formatCountdown(
                          countdownMs
                        )}
                        s
                      </span>
                    </p>
                  </div>
                )}

                {/* Bottom status */}
                <div className="absolute bottom-4 left-4 right-4 z-30 flex items-end justify-between gap-3">
                  <div className="max-w-[75%] rounded-xl border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-md">
                    <p className="truncate text-xs text-slate-300">
                      {message}
                    </p>
                  </div>

                  {hasQueuedBet && (
                    <div className="shrink-0 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Next Round Bet
                    </div>
                  )}
                </div>
              </div>

              {/* BET PANEL */}
              <div className="border-t border-white/10 bg-[#091525] p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">

                  {/* Amount */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                      Bet amount
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        step="0.01"
                        value={
                          betAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setBetAmount(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          loading ||
                          hasActiveBet ||
                          hasQueuedBet
                        }
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-12 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-red-500/50 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="10.00"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        CR
                      </span>
                    </div>
                  </div>

                  {/* Auto Cashout */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                        Auto Cashout
                      </label>

                      <button
                        type="button"
                        aria-label="Toggle auto cashout"
                        aria-pressed={
                          autoCashoutEnabled
                        }
                        onClick={() => {
                          if (
                            hasActiveBet ||
                            hasQueuedBet
                          ) {
                            return;
                          }

                          setAutoCashoutEnabled(
                            (previous) =>
                              !previous
                          );
                        }}
                        disabled={
                          hasActiveBet ||
                          hasQueuedBet
                        }
                        className={`relative h-6 w-11 rounded-full transition ${
                          autoCashoutEnabled
                            ? "bg-emerald-500"
                            : "bg-white/10"
                        } ${
                          hasActiveBet ||
                          hasQueuedBet
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                            autoCashoutEnabled
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min="1.01"
                        step="0.01"
                        value={
                          autoCashout
                        }
                        onChange={(
                          event
                        ) =>
                          setAutoCashout(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          !autoCashoutEnabled ||
                          hasActiveBet ||
                          hasQueuedBet
                        }
                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-10 text-sm font-bold text-white outline-none transition focus:border-emerald-500/50 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                        placeholder="2.00"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        x
                      </span>
                    </div>

                    <p
                      className={`mt-1.5 text-[10px] ${
                        autoCashoutEnabled
                          ? validAutoCashout
                            ? "text-emerald-400"
                            : "text-red-400"
                          : "text-slate-600"
                      }`}
                    >
                      {autoCashoutEnabled
                        ? validAutoCashout
                          ? `Automatic cashout at ${parsedAutoCashout.toFixed(
                              2
                            )}x`
                          : "Enter a value above 1.00x"
                        : "OFF — cash out manually"}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex items-end">
                    {hasActiveBet ? (
                      <button
                        type="button"
                        onClick={
                          handleCashout
                        }
                        disabled={
                          !canCashout
                        }
                        className="h-12 w-full min-w-[170px] rounded-xl bg-emerald-500 px-6 text-sm font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cashoutLoading
                          ? "Cashing..."
                          : `Cash Out ${displayMultiplier.toFixed(
                              2
                            )}x`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          handleBet
                        }
                        disabled={
                          loading ||
                          hasQueuedBet ||
                          (autoCashoutEnabled &&
                            !validAutoCashout)
                        }
                        className="h-12 w-full min-w-[170px] rounded-xl bg-red-500 px-6 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-500/10 transition hover:bg-red-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading
                          ? "Placing..."
                          : hasQueuedBet
                          ? "Queued"
                          : isRunning
                          ? "Bet Next Round"
                          : "Place Bet"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto cashout explanation */}
                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                  <p className="text-[10px] leading-5 text-slate-600">
                    {autoCashoutEnabled
                      ? "Auto Cashout is ON. Your active bet will attempt to cash out when the selected multiplier is reached."
                      : "Auto Cashout is OFF. Your bet will stay active until you manually press Cash Out or the round crashes."}
                  </p>
                </div>

                {/* Bet info */}
                {(hasActiveBet ||
                  hasQueuedBet ||
                  bet.cashedOut) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-400">
                      Bet{" "}
                      <span className="font-bold text-white">
                        {bet.amount.toFixed(
                          2
                        )}
                      </span>
                    </div>

                    {hasActiveBet && (
                      <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-semibold text-emerald-300">
                        Active
                      </div>
                    )}

                    {hasQueuedBet && (
                      <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 font-semibold text-amber-300">
                        Queued for next round
                      </div>
                    )}

                    {autoCashoutEnabled &&
                      hasActiveBet && (
                        <div className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 font-semibold text-blue-300">
                          Auto{" "}
                          {parsedAutoCashout.toFixed(
                            2
                          )}
                          x
                        </div>
                      )}

                    {bet.cashedOut && (
                      <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-semibold text-emerald-300">
                        +{bet.payout.toFixed(
                          2
                        )} at{" "}
                        {bet.cashoutMultiplier.toFixed(
                          2
                        )}
                        x
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-4">

            {/* Status */}
            <div className="rounded-2xl border border-white/10 bg-[#0b1728] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Zap
                    size={16}
                    className="text-amber-400"
                  />
                  Game Status
                </h2>

                <div
                  className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                    isRunning
                      ? "bg-emerald-400/10 text-emerald-400"
                      : "bg-amber-400/10 text-amber-400"
                  }`}
                >
                  {isRunning
                    ? "Live"
                    : "Waiting"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Round
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {roundNumber
                      ? `#${roundNumber}`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.03] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Multiplier
                  </p>

                  <p className="mt-1 text-sm font-black">
                    {isRunning
                      ? `${displayMultiplier.toFixed(
                          2
                        )}x`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-400/10 bg-blue-400/5 p-3">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-blue-400"
                />

                <p className="text-[11px] leading-5 text-slate-400">
                  The server controls the
                  live round. Your screen
                  animation follows the
                  server round timing.
                </p>
              </div>
            </div>

            {/* History */}
            <div className="rounded-2xl border border-white/10 bg-[#0b1728] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <History
                    size={16}
                    className="text-red-400"
                  />
                  Recent Results
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    void loadHistory()
                  }
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {history.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <TrendingUp
                    size={22}
                    className="mx-auto text-slate-700"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    No completed rounds yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.map(
                    (item) => {
                      const value =
                        Number(
                          item.multiplier
                        );

                      const className =
                        value < 2
                          ? "border-red-400/15 bg-red-400/5 text-red-300"
                          : value < 5
                          ? "border-amber-400/15 bg-amber-400/5 text-amber-300"
                          : "border-emerald-400/15 bg-emerald-400/5 text-emerald-300";

                      return (
                        <div
                          key={`${item.roundNumber}-${item.crashedAt}`}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${className}`}
                        >
                          {value.toFixed(
                            2
                          )}
                          x
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="rounded-2xl border border-white/10 bg-[#0b1728] p-4">
              <h2 className="mb-3 text-sm font-bold">
                How it works
              </h2>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-black text-red-400">
                    1
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Place your bet during
                    the betting window.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-black text-red-400">
                    2
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    When the plane starts,
                    the multiplier rises
                    continuously.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-black text-red-400">
                    3
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Auto Cashout is optional.
                    Leave it OFF to cash
                    out manually.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-black text-red-400">
                    4
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    If you try to bet after
                    launch, your bet goes
                    to the next round.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}