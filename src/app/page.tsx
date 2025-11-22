"use client";

import { Float, Sparkles, Text } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Texture } from "three";
import { MathUtils, TextureLoader, VideoTexture } from "three";
import type { MutableRefObject } from "react";

type Locale = "ru" | "en" | "th";

type SlotSymbol = {
  id: string;
  label: string;
  labels: Record<Locale, string>;
  icon: string;
  accent: string;
  weight: number;
  multiplier: number;
};

type ReelStrip = SlotSymbol[];

type SpinResult = {
  win: number;
  message: string;
  highlighted?: string;
  streak: number;
};

const SYMBOLS: SlotSymbol[] = [
  {
    id: "wild",
    label: "Neon Wild",
    labels: { ru: "Неон Wild", en: "Neon Wild", th: "นีออนไวลด์" },
    icon: "★",
    accent: "from-emerald-400 via-lime-300 to-emerald-700",
    weight: 8,
    multiplier: 12,
  },
  {
    id: "seven",
    label: "Lucky 7",
    labels: { ru: "Счастливая 7", en: "Lucky 7", th: "เลข 7 แห่งโชค" },
    icon: "7️⃣",
    accent: "from-fuchsia-500 via-pink-500 to-orange-400",
    weight: 10,
    multiplier: 9,
  },
  {
    id: "diamond",
    label: "Crystal",
    labels: { ru: "Кристалл", en: "Crystal", th: "คริสตัล" },
    icon: "💎",
    accent: "from-sky-400 via-cyan-400 to-indigo-500",
    weight: 14,
    multiplier: 6,
  },
  {
    id: "bar",
    label: "BAR",
    labels: { ru: "BAR", en: "BAR", th: "BAR" },
    icon: "🟥",
    accent: "from-amber-300 via-yellow-300 to-orange-500",
    weight: 16,
    multiplier: 4.2,
  },
  {
    id: "cherry",
    label: "Cherry",
    labels: { ru: "Вишня", en: "Cherry", th: "เชอร์รี่" },
    icon: "🍒",
    accent: "from-rose-500 via-red-500 to-orange-500",
    weight: 20,
    multiplier: 3,
  },
  {
    id: "bell",
    label: "Bell",
    labels: { ru: "Колокол", en: "Bell", th: "ระฆัง" },
    icon: "🔔",
    accent: "from-amber-400 via-orange-400 to-amber-500",
    weight: 22,
    multiplier: 2.4,
  },
];

const REEL_COUNT = 5;
const ROWS = 3;
const REEL_SPACING = 1.75;
const REEL_RADIUS = 3;
const HEAT_COLORS = [
  "#3be8ff",
  "#22d3ee",
  "#34d399",
  "#a3e635",
  "#fbbf24",
  "#fb923c",
  "#ef4444",
];
const COPY: Record<
  Locale,
  {
    readyStatus: string;
    demoSpinStatus: string;
    spinStatus: string;
    insufficientFunds: string;
    almost: string;
    headline: string;
    subheadline: string;
    rtpLabel: string;
    noRegister: string;
    balance: string;
    bet: string;
    lastWin: string;
    demo3x: string;
    spin: string;
    spinRunning: string;
    paylineLabel: string;
    paylineHint: string;
    betSetup: string;
    demoLabel: string;
    betPerLine: string;
    historyTitle: string;
    historyEmpty: string;
    paytableTitle: string;
    paytableBadge: string;
    linePrefix: string;
    winningsLabel: string;
    rtpPrefix: string;
    winningLine: string;
    legendarySevens: string;
    wildJackpot: string;
    language: string;
    frequency: string;
  }
> = {
  ru: {
    readyStatus: "Готов к запуску. Нажми SPIN!",
    demoSpinStatus: "Демо-запуск барабанов...",
    spinStatus: "Вращаем барабаны...",
    insufficientFunds: "Недостаточно средств. Запусти демо или снизь ставку.",
    almost: "Почти! Собери 3+ символа на центральной линии.",
    headline: "Супер-яркий слот в стиле реального казино",
    subheadline:
      "Пять барабанов, живой неон и честные выплаты. Запускай демо, тестируй ставки и ловите легендарные семёрки.",
    rtpLabel: "Без регистрации",
    noRegister: "Без регистрации",
    balance: "Баланс",
    bet: "Ставка",
    lastWin: "Последний выигрыш",
    demo3x: "Демо 3x",
    spin: "Spin",
    spinRunning: "SPIN...",
    paylineLabel: "Линия выплат: центр",
    paylineHint: "Central Payline",
    betSetup: "Настройка ставки",
    demoLabel: "Демо",
    betPerLine: "Ставка за линию",
    historyTitle: "История (последние)",
    historyEmpty: "Здесь появятся последние спины.",
    paytableTitle: "Таблица выплат",
    paytableBadge: "3+ по центру",
    linePrefix: "Линия",
    winningsLabel: "за 3-5 в линию",
    rtpPrefix: "RTP",
    winningLine: "Выигрышная линия!",
    legendarySevens: "Легендарные семёрки!",
    wildJackpot: "Мега-джекпот Wild!",
    language: "Язык",
    frequency: "частота",
  },
  en: {
    readyStatus: "Ready. Hit SPIN!",
    demoSpinStatus: "Demo spin starting...",
    spinStatus: "Spinning reels...",
    insufficientFunds: "Not enough balance. Run demo or lower the bet.",
    almost: "Almost! Collect 3+ symbols on the center line.",
    headline: "Ultra-bright slot, real casino vibe",
    subheadline:
      "Five reels, neon vibes and fair payouts. Run demo, test bets, and chase legendary sevens.",
    rtpLabel: "No registration",
    noRegister: "No registration",
    balance: "Balance",
    bet: "Bet",
    lastWin: "Last win",
    demo3x: "Demo 3x",
    spin: "Spin",
    spinRunning: "SPIN...",
    paylineLabel: "Payline: center",
    paylineHint: "Central Payline",
    betSetup: "Bet settings",
    demoLabel: "Demo",
    betPerLine: "Bet per line",
    historyTitle: "History (latest)",
    historyEmpty: "Your last spins will appear here.",
    paytableTitle: "Paytable",
    paytableBadge: "3+ center",
    linePrefix: "Line",
    winningsLabel: "for 3-5 in line",
    rtpPrefix: "RTP",
    winningLine: "Winning line!",
    legendarySevens: "Legendary sevens!",
    wildJackpot: "Mega Wild jackpot!",
    language: "Language",
    frequency: "frequency",
  },
  th: {
    readyStatus: "พร้อมแล้ว กด SPIN!",
    demoSpinStatus: "เดโม่กำลังเริ่ม...",
    spinStatus: "กำลังหมุนวงล้อ...",
    insufficientFunds: "ยอดเงินไม่พอ ลองเดโม่หรือปรับเดิมพันลง.",
    almost: "เกือบแล้ว! รวบรวม 3+ สัญลักษณ์บนเส้นกลาง.",
    headline: "สล็อตนีออนสว่างสดเหมือนคาสิโนจริง",
    subheadline:
      "ห้าวงล้อ แสงนีออน และจ่ายแฟร์ ลองเดโม่ ทดลองเดิมพัน แล้วล่าหาเลขเจ็ดในตำนาน.",
    rtpLabel: "ไม่ต้องสมัคร",
    noRegister: "ไม่ต้องสมัคร",
    balance: "ยอดเงิน",
    bet: "เดิมพัน",
    lastWin: "ชนะล่าสุด",
    demo3x: "เดโม่ 3x",
    spin: "Spin",
    spinRunning: "SPIN...",
    paylineLabel: "เพย์ไลน์: กลาง",
    paylineHint: "เส้นจ่ายกลาง",
    betSetup: "ตั้งค่าเดิมพัน",
    demoLabel: "เดโม่",
    betPerLine: "เดิมพันต่อเส้น",
    historyTitle: "ประวัติ (ล่าสุด)",
    historyEmpty: "สปินล่าสุดจะแสดงที่นี่.",
    paytableTitle: "ตารางจ่าย",
    paytableBadge: "3+ กลาง",
    linePrefix: "ไลน์",
    winningsLabel: "สำหรับ 3-5 บนไลน์",
    rtpPrefix: "RTP",
    winningLine: "ไลน์ชนะ!",
    legendarySevens: "เซเว่นในตำนาน!",
    wildJackpot: "แจ็กพอตไวลด์!",
    language: "ภาษา",
    frequency: "ความถี่",
  },
};
const SYMBOL_SWATCH: Record<string, { base: string; glow: string }> = {
  wild: { base: "#3cf5a3", glow: "#9ef6cf" },
  seven: { base: "#ff6ac8", glow: "#ffd36f" },
  diamond: { base: "#5fe0ff", glow: "#8bd7ff" },
  bar: { base: "#ffc24b", glow: "#ff986c" },
  cherry: { base: "#ff7075", glow: "#ff9ab5" },
  bell: { base: "#ffb347", glow: "#ffd157" },
};

const weightedSymbol = () => {
  const totalWeight = SYMBOLS.reduce((sum, sym) => sum + sym.weight, 0);
  const roll = Math.random() * totalWeight;
  let cursor = 0;

  for (const symbol of SYMBOLS) {
    cursor += symbol.weight;
    if (roll <= cursor) {
      return symbol;
    }
  }

  return SYMBOLS[SYMBOLS.length - 1];
};

const buildRow = () => Array.from({ length: ROWS }, () => weightedSymbol());

const createReels = (): ReelStrip[] =>
  Array.from({ length: REEL_COUNT }, () => buildRow());

const spinJitter = () => {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % 200;
  }

  return Date.now() % 200;
};

const evaluateSpin = (
  reels: ReelStrip[],
  bet: number,
  locale: Locale
): SpinResult => {
  const copy = COPY[locale];
  // Payline: center row across all reels.
  const payline = reels.map((reel) => reel[1]);

  const counts = payline.reduce<Record<string, number>>((acc, symbol) => {
    acc[symbol.id] = (acc[symbol.id] ?? 0) + 1;
    return acc;
  }, {});

  const [bestSymbolId, bestCount] = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const bestSymbol = SYMBOLS.find((sym) => sym.id === bestSymbolId)!;

  if (bestCount < 3) {
    return {
      win: 0,
      message: copy.almost,
      highlighted: undefined,
      streak: bestCount,
    };
  }

  const streakMultiplier =
    bestCount === 5 ? 2.5 : bestCount === 4 ? 1.6 : 1.15;
  const win = Math.round(bet * bestSymbol.multiplier * streakMultiplier);

  const epicLine =
    bestSymbolId === "wild" && bestCount === REEL_COUNT
      ? `${copy.wildJackpot} ✨`
      : bestSymbolId === "seven" && bestCount >= 4
        ? `${copy.legendarySevens} 🔥`
        : copy.winningLine;

  return {
    win,
    message: `${epicLine} ${bestCount}x ${bestSymbol.labels[locale]}`,
    highlighted: bestSymbolId,
    streak: bestCount,
  };
};

const settleReels = (
  dynamicsRef: MutableRefObject<{ rotation: number; velocity: number }[]>
) => {
  dynamicsRef.current = dynamicsRef.current.map(() => ({
    rotation: 0, // face the player head-on
    velocity: 0,
  }));
};

const NeonBackground = () => (
  <div className="pointer-events-none absolute inset-0">
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }} style={{ height: '100%', width: '100%' }}>
      <color attach="background" args={["#050312"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 6, 6]} color="#ff44cc" intensity={20} />
      <pointLight position={[5, -3, 4]} color="#3be8ff" intensity={12} />
      <Float speed={2.4} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh>
          <torusKnotGeometry args={[1.5, 0.42, 420, 32]} />
          <meshStandardMaterial
            color="#ff2fb6"
            emissive="#ff2fb6"
            emissiveIntensity={2.3}
            roughness={0.25}
            metalness={0.35}
          />
        </mesh>
      </Float>
      <Float speed={1.4} position={[0, -1.5, -1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 3.6, 64]} />
          <meshStandardMaterial
            color="#3be8ff"
            emissive="#2ab8ff"
            emissiveIntensity={1.2}
            transparent
            opacity={0.7}
          />
        </mesh>
      </Float>
      <Sparkles count={420} speed={0.3} size={2} color="#a7f3ff" />
    </Canvas>
  </div>
);

const StatTile = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur">
    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <div
        className="absolute inset-0 blur-2xl"
        style={{
          background:
            accent ??
            "radial-gradient(circle at 20% 30%, rgba(255,77,196,0.24), transparent 40%)",
        }}
      />
    </div>
    <p className="text-xs uppercase tracking-[0.16em] text-white/70">
      {label}
    </p>
    <p className="mt-1 text-2xl font-semibold text-white drop-shadow-lg">
      {value}
    </p>
  </div>
);

const Reel = ({
  index,
  symbols,
  highlighted,
  spinning,
  dynamicsRef,
  winningMap,
  locale,
}: {
  index: number;
  symbols: ReelStrip;
  highlighted?: string;
  dynamicsRef: MutableRefObject<
    { rotation: number; velocity: number }[]
  >;
  spinning: boolean;
  winningMap: boolean[];
  locale: Locale;
}) => {
  const group = useRef<Group>(null);
  const panelCount = 12;
  const radius = REEL_RADIUS;
  const angleStep = (Math.PI * 2) / panelCount;
  const snapStep = angleStep * 3; // align so центральный ряд (индекс 1) остаётся спереди
  const spacing = REEL_SPACING;
  const xPos = useMemo(
    () => index * spacing - (spacing * (REEL_COUNT - 1)) / 2,
    [index, spacing]
  );
  const reelWin = winningMap[index];
  const MEDIA_ASSETS: Record<string, { image: string; video?: string }> = {
    wild: { image: "/assets/images/wild.png", video: "/assets/videos/wild.mp4" },
    seven: { image: "/assets/images/7.jpg", video: "/assets/videos/7.mp4" },
    cherry: { image: "/assets/images/cherry.jpg", video: "/assets/videos/cherry.mp4" },
    bell: { image: "/assets/images/bell.jpg", video: "/assets/videos/bell.mp4" },
    diamond: { image: "/assets/images/diamond.jpg", video: "/assets/videos/diamond.mp4" },
  };
  const mediaKeys = useMemo(() => Object.keys(MEDIA_ASSETS), []);
  const imageTextures = useLoader(
    TextureLoader,
    mediaKeys.map((key) => MEDIA_ASSETS[key].image)
  );
  const imageMap = useMemo(
    () =>
      mediaKeys.reduce<Record<string, Texture>>((acc, key, idx) => {
        acc[key] = imageTextures[idx];
        return acc;
      }, {}),
    [imageTextures, mediaKeys]
  );
  const videoMap = useRef<Record<string, { el: HTMLVideoElement; texture: VideoTexture }>>({});

  useEffect(() => {
    if (typeof document === "undefined") return;
    mediaKeys.forEach((key) => {
      const existing = videoMap.current[key];
      if (existing || !MEDIA_ASSETS[key].video) return;
      const videoEl = document.createElement("video");
      videoEl.src = MEDIA_ASSETS[key].video!;
      videoEl.crossOrigin = "anonymous";
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.preload = "auto";
      const texture = new VideoTexture(videoEl);
      videoMap.current[key] = { el: videoEl, texture };
    });
  }, [mediaKeys]);

  useEffect(() => {
    mediaKeys.forEach((id) => {
      const media = videoMap.current[id];
      if (!media) return;
      const shouldPlay = symbols.some((s) => s.id === id);
      if (!media.el) return;
      if (shouldPlay) {
        media.el.currentTime = 0;
        void media.el.play();
        media.texture.needsUpdate = true;
      } else {
        media.el.pause();
        media.el.currentTime = 0;
      }
    });
  }, [highlighted, winningMap, index, mediaKeys, symbols]);
  const circularPanels = useMemo(
    () =>
      Array.from({ length: panelCount }, (_, panelIdx) => {
        const sourceIdx = panelIdx % symbols.length;
        const symbol = symbols[sourceIdx];

        return {
          symbol,
          angle: -angleStep + panelIdx * angleStep,
          isPayline: sourceIdx === 1,
        };
      }),
    [angleStep, panelCount, symbols]
  );

  useEffect(() => {
    if (spinning) {
      const dyn = dynamicsRef.current[index];
      dyn.velocity = 10 - index * 0.6;
      dyn.rotation = dyn.rotation % (Math.PI * 2);
    }
  }, [dynamicsRef, index, spinning]);

  useFrame((_, delta) => {
    const decel = spinning ? 0.9 : 2.2;
    const dyn = dynamicsRef.current[index];
    dyn.rotation += dyn.velocity * delta;
    if (spinning) {
      dyn.velocity = Math.max(
        4.5 - index * 0.35,
        dyn.velocity - decel * delta
      );
    } else {
      dyn.velocity = Math.max(0, dyn.velocity - decel * delta);
      if (dyn.velocity < 0.02) {
        dyn.velocity = 0;
        dyn.rotation = Math.round(dyn.rotation / snapStep) * snapStep;
      }
    }

    if (group.current) {
      group.current.rotation.x = dyn.rotation;
      group.current.rotation.z = 0;
      group.current.position.y = 0;
    }
  });

  return (
    <group ref={group} position={[xPos, 0, 0]}>
      {circularPanels.map(({ symbol, angle, isPayline }, idx) => {
        const isWin = isPayline && symbol.id === highlighted;
        const swatch = SYMBOL_SWATCH[symbol.id] ?? {
          base: "#3be8ff",
          glow: "#ff7bd7",
        };
        const y = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const hasMedia = symbol.id in MEDIA_ASSETS;
        const mediaTexture =
          hasMedia && videoMap.current[symbol.id]
            ? videoMap.current[symbol.id].texture
            : hasMedia
            ? imageMap[symbol.id]
            : null;

        return (
          <group
            key={`${symbol.id}-${idx}`}
            position={[0, y, z]}
            rotation={[-angle, 0, 0]}
          >
            <mesh>
              <planeGeometry args={[1.7, 1.7]} />
              <meshStandardMaterial
                color={swatch.base}
                emissive={swatch.glow}
                emissiveIntensity={isWin ? 2.4 : reelWin ? 1.4 : 0.9}
                metalness={0.38}
                roughness={0.24}
                transparent
                opacity={0.9}
                side={2}
              />
          </mesh>
          <mesh position={[0, 0.06, 0.08]}>
            <planeGeometry args={[1.55, 1.55]} />
            <meshBasicMaterial
              color={mediaTexture ? "#ffffff" : "#f1f5f9"}
              map={mediaTexture ?? undefined}
            />
          </mesh>
          {!hasMedia && (
            <Text
              position={[0, 0.08, 0.12]}
              fontSize={0.56}
              color="#0f172a"
              anchorX="center"
                anchorY="middle"
                outlineWidth={isWin ? 0.12 : 0.06}
                outlineColor={isWin ? "#16a34a" : "#cbd5e1"}
                fillOpacity={1}
              >
                {symbol.icon}
              </Text>
            )}
            <Text
              position={[0, -0.46, 0.1]}
              fontSize={0.18}
              color="#1f2937"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.05}
            >
              {symbol.labels[locale]}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

const WinLine = ({
  winningMap,
  winHeat,
}: {
  winningMap: boolean[];
  winHeat: number;
}) => {
  const active = winningMap
    .map((hit, idx) => (hit ? idx : -1))
    .filter((idx) => idx >= 0);

  if (active.length < 2) return null;

  const xPositions = active.map(
    (idx) => idx * REEL_SPACING - (REEL_SPACING * (REEL_COUNT - 1)) / 2
  );
  const minX = Math.min(...xPositions);
  const maxX = Math.max(...xPositions);
  const width = Math.max(1.4, maxX - minX + 1.2);
  const lineZ = REEL_RADIUS + 0.24;
  const paletteIdx = Math.min(
    HEAT_COLORS.length - 1,
    Math.max(0, Math.round(winHeat * (HEAT_COLORS.length - 1)))
  );
  const color = HEAT_COLORS[paletteIdx];
  const opacity = 0.22 + winHeat * 0.35;

  return (
    <group>
      <mesh position={[(minX + maxX) / 2, 0, lineZ]}>
        <planeGeometry args={[width, 0.18]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={2}
        />
      </mesh>
      {xPositions.map((x, idx) => (
        <mesh key={`win-dot-${idx}`} position={[x, 0, lineZ + 0.01]}>
          <circleGeometry args={[0.24, 28]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={Math.min(1, 0.65 + winHeat * 0.35)}
            side={2}
          />
        </mesh>
      ))}
    </group>
  );
};

const Lever = ({
  onPull,
  disabled,
}: {
  onPull: () => void;
  disabled: boolean;
}) => {
  const leverRef = useRef<Group>(null);
  const handleRef = useRef<Group>(null);
  const aimRef = useRef(0);

  const pull = () => {
    if (disabled) return;
    aimRef.current = -1.1;
    onPull();
    setTimeout(() => {
      aimRef.current = 0;
    }, 420);
  };

  useFrame((state) => {
    if (!leverRef.current) return;

    const target = aimRef.current;
    leverRef.current.rotation.x = MathUtils.lerp(
      leverRef.current.rotation.x,
      target,
      0.16
    );

    leverRef.current.rotation.z = MathUtils.lerp(
      leverRef.current.rotation.z,
      disabled ? 0 : Math.sin(state.clock.elapsedTime * 3) * 0.04,
      0.12
    );

    if (handleRef.current) {
      handleRef.current.position.y = MathUtils.lerp(
        handleRef.current.position.y,
        target < -0.3 ? -0.3 : 0,
        0.18
      );
    }
  });

  return (
    <group
      ref={leverRef}
      position={[7.2, -0.4, 2.6]}
      onPointerDown={pull}
      onPointerUp={() => {
        aimRef.current = 0;
      }}
      onPointerOver={() => {
        document.body.style.cursor = disabled ? "not-allowed" : "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 1.4, 18]} />
        <meshStandardMaterial
          color="#0a1022"
          metalness={0.6}
          roughness={0.35}
          emissive="#1b2b55"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 16]} />
        <meshStandardMaterial
          color="#1f2f55"
          metalness={0.5}
          roughness={0.3}
          emissive="#93c5fd"
          emissiveIntensity={0.4}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.16, 0.14, 3.8, 14]} />
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.45}
          roughness={0.35}
          emissive="#0f172a"
          emissiveIntensity={0.4}
        />
      </mesh>

      <group ref={handleRef} position={[0, 1.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.48, 24, 16]} />
          <meshStandardMaterial
            color={disabled ? "#94a3b8" : "#f472b6"}
            emissive={disabled ? "#94a3b8" : "#fb7185"}
            emissiveIntensity={disabled ? 0.8 : 1.8}
            metalness={0.35}
            roughness={0.2}
          />
        </mesh>
        <Text
          position={[0, -0.9, 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.24}
          anchorX="center"
          anchorY="middle"
          color="#ffffff"
          outlineWidth={0.06}
          outlineColor="#0f172a"
        >
          PULL
        </Text>
      </group>
    </group>
  );
};

const ReelCanvas = ({
  reels,
  highlighted,
  spinning,
  dynamicsRef,
  onLeverPull,
  winningMap,
  winHeat,
  locale,
  canShowLine,
}: {
  reels: ReelStrip[];
  highlighted?: string;
  spinning: boolean;
  dynamicsRef: MutableRefObject<{ rotation: number; velocity: number }[]>;
  onLeverPull: () => void;
  winningMap?: boolean[];
  winHeat: number;
  locale: Locale;
  canShowLine: boolean;
}) => (
  <Canvas
    camera={{ position: [0, 2, 12], fov: 30 }}
    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 min-h-[550px] h-[70vh] max-h-[720px]"
    style={{ minHeight: 450 }}
  >
    <color attach="background" args={["#040713"]} />
    <fog attach="fog" args={["#040713", 12, 22]} />
    <ambientLight intensity={0.5} />
    <spotLight
      position={[0, 12, 14]}
      angle={0.4}
      intensity={2}
      color="#ffe0b8"
      penumbra={0.8}
      castShadow
    />
    <pointLight position={[-6, 2, 8]} color="#7dd3fc" intensity={1.2} />
    <pointLight position={[6, -2, 6]} color="#fb7185" intensity={1.1} />

    <group position={[0, 0.8, 0]} rotation={[-0.1, 0, 0]}>
      {reels.map((reel, idx) => (
        <Reel
          key={`reel-3d-${idx}`}
          index={idx}
          symbols={reel}
          highlighted={highlighted}
          dynamicsRef={dynamicsRef}
          spinning={spinning}
          winningMap={winningMap ?? []}
          locale={locale}
        />
      ))}
      {!spinning &&
        canShowLine &&
        (winningMap ?? []).filter(Boolean).length >= 2 && (
          <WinLine winningMap={winningMap ?? []} winHeat={winHeat} />
        )}
      <Lever onPull={onLeverPull} disabled={spinning} />
      <mesh position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.4, 8, 64]} />
        <meshBasicMaterial
          color="#7dd3fc"
          opacity={0.16}
          transparent
          side={2}
        />
      </mesh>
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7, 7.2, 6]} />
        <meshBasicMaterial
          color="#ec4899"
          opacity={0.28}
          transparent
          side={2}
        />
      </mesh>
    </group>
  </Canvas>
);

export default function Home() {
  const [reels, setReels] = useState<ReelStrip[]>(createReels);
  const [balance, setBalance] = useState(5000);
  const [bet, setBet] = useState(120);
  const [lastWin, setLastWin] = useState(0);
  const [locale, setLocale] = useState<Locale>("ru");
  const copy = COPY[locale];
  const [status, setStatus] = useState(copy.readyStatus);
  const [highlighted, setHighlighted] = useState<string | undefined>();
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<SpinResult[]>([]);
  const [winningMap, setWinningMap] = useState<boolean[]>(
    Array(REEL_COUNT).fill(false)
  );
  const [winHeat, setWinHeat] = useState(0);
  const [canShowLine, setCanShowLine] = useState(true);

  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const reelDynamicsRef = useRef(
    Array.from({ length: REEL_COUNT }, () => ({
      rotation: 0,
      velocity: 0,
    }))
  );
  const demoQueueRef = useRef(0);

  const rtp = useMemo(() => 97.1, []);

  useEffect(() => {
    if (!isSpinning) {
      setStatus(copy.readyStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const clearTimers = () => {
    intervalRefs.current.forEach(clearInterval);
    timeoutRefs.current.forEach(clearTimeout);
    intervalRefs.current = [];
    timeoutRefs.current = [];
  };

  useEffect(() => clearTimers, []);

  const runSpin = (isDemo = false) => {
    if (isSpinning) return;
    if (!isDemo) {
      demoQueueRef.current = 0;
    }

    if (balance < bet) {
      if (isDemo) {
        setBalance((prev) => prev + bet * 8);
      } else {
        setStatus(copy.insufficientFunds);
        return;
      }
    }

    clearTimers();
    setIsSpinning(true);
    setHighlighted(undefined);
    setWinningMap(Array(REEL_COUNT).fill(false));
    setWinHeat(0);
    setCanShowLine(false);
    setStatus(isDemo ? copy.demoSpinStatus : copy.spinStatus);
    setBalance((prev) => prev - bet);
    setLastWin(0);
    reelDynamicsRef.current = reelDynamicsRef.current.map((dyn, i) => ({
      rotation: dyn.rotation,
      velocity: 9.5 - i * 0.5,
    }));

    const finalReels: ReelStrip[] = [];

    for (let i = 0; i < REEL_COUNT; i += 1) {
      const interval = setInterval(() => {
        setReels((prev) => {
          const next = [...prev];
          next[i] = buildRow();
          return next;
        });
      }, 80 + i * 12);

      intervalRefs.current.push(interval);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        const stopRow = buildRow();
        finalReels[i] = stopRow;

        setReels((prev) => {
          const next = [...prev];
          next[i] = stopRow;
          return next;
        });

        reelDynamicsRef.current[i] = {
          rotation: reelDynamicsRef.current[i].rotation,
          velocity: 0.5,
        };

        const stopped = finalReels.filter(Boolean).length;
        if (stopped === REEL_COUNT) {
          const result = evaluateSpin(finalReels, bet, locale);
          setLastWin(result.win);
          setBalance((prev) => prev + result.win);
          setStatus(result.message);
          setHighlighted(result.highlighted);
          const hits =
            result.win > 0 && result.highlighted
              ? finalReels.map((reel) => reel[1].id === result.highlighted)
              : Array(REEL_COUNT).fill(false);
          setWinningMap(hits);
          const heat =
            result.win > 0
              ? Math.min(
                  1,
                  (result.streak - 2) / 3 +
                    Math.min(result.win / Math.max(bet * 8, 1), 0.6)
                )
              : 0;
          setWinHeat(Math.max(0, heat));
          const lineTimer = setTimeout(() => setCanShowLine(true), 120);
          timeoutRefs.current.push(lineTimer);

          const shouldQueueNext = isDemo && demoQueueRef.current > 0;
          if (shouldQueueNext) {
            demoQueueRef.current -= 1;
            setTimeout(() => runSpin(true), 700);
          } else {
            demoQueueRef.current = 0;
            settleReels(reelDynamicsRef);
          }

          setIsSpinning(false);
          setHistory((prev) => {
            const kit = [result, ...prev];
            return kit.slice(0, 5);
          });
        }
      }, 1100 + i * 220 + spinJitter());

      timeoutRefs.current.push(timeout);
    }
  };

  const handleDemo = () => {
    if (isSpinning) return;
    demoQueueRef.current = 2;
    runSpin(true);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    });

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <NeonBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,54,168,0.35),transparent_32%),radial-gradient(circle_at_70%_10%,rgba(54,197,255,0.35),transparent_30%),radial-gradient(circle_at_30%_80%,rgba(17,255,172,0.25),transparent_32%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/60" />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-emerald-200">
                Demo Lounge
              </span>
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500/80 via-amber-400/80 to-cyan-400/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_40px_rgba(255,63,160,0.35)]">
                Neon Jackpot
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {copy.headline}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-white/70">
              {copy.subheadline}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/70 md:items-end">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {copy.rtpPrefix} {rtp.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>{copy.noRegister}</span>
            </div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/60">
              {copy.language}
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-white"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="th">ไทย</option>
              </select>
            </label>
          </div>
        </header>

        <section className="grid items-start gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="absolute inset-x-10 top-4 h-40 rounded-full bg-gradient-to-r from-fuchsia-500/20 via-amber-300/10 to-cyan-400/20 opacity-60 blur-3xl" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-3">
                  <StatTile label={copy.balance} value={formatCurrency(balance)} />
                  <StatTile
                    label={copy.bet}
                    value={formatCurrency(bet)}
                    accent="radial-gradient(circle at 50% 40%, rgba(59,232,255,0.4), transparent 50%)"
                  />
                  <StatTile
                    label={copy.lastWin}
                    value={formatCurrency(lastWin)}
                    accent="radial-gradient(circle at 80% 50%, rgba(255,105,180,0.35), transparent 48%)"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDemo}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
                    disabled={isSpinning}
                  >
                    {copy.demo3x}
                  </button>
                  <button
                    onClick={() => runSpin()}
                    disabled={isSpinning}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-amber-400 to-cyan-400 px-7 py-3 text-base font-bold uppercase tracking-[0.22em] text-slate-950 shadow-[0_20px_80px_rgba(255,76,190,0.5)] transition hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/20 opacity-0 transition hover:opacity-40" />
                    {isSpinning ? copy.spinRunning : copy.spin}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
                <div className="flex items-center justify-between px-2 pb-3 text-sm uppercase tracking-[0.2em] text-white/60">
                  <span>{copy.paylineLabel}</span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-ping rounded-full bg-lime-400" />
                    {status}
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 via-white/5 to-transparent p-2 shadow-[0_20px_80px_rgba(255,63,160,0.25)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.16),transparent_35%)]" />
                  <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(59,232,255,0.12),transparent_45%,rgba(255,77,196,0.15),transparent_75%)] blur-3xl" />
                  <ReelCanvas
                    reels={reels}
                    highlighted={highlighted}
                    spinning={isSpinning}
                    dynamicsRef={reelDynamicsRef}
                    onLeverPull={() => runSpin()}
                    winningMap={winningMap}
                    winHeat={winHeat}
                    locale={locale}
                    canShowLine={canShowLine}
                  />
                  <div className="pointer-events-none absolute inset-x-4 bottom-1 flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    {copy.paylineHint}
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
              <span>{copy.betSetup}</span>
              <span>{copy.demoLabel}</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>{copy.betPerLine}</span>
                <span className="font-semibold">{formatCurrency(bet)}</span>
              </div>
              <input
                type="range"
                min={20}
                max={600}
                step={10}
                value={bet}
                onChange={(event) => setBet(Number(event.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-fuchsia-400"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[50, 120, 240, 360, 480].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBet(value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${bet === value
                        ? "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-slate-950"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                  >
                    {formatCurrency(value)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>{copy.historyTitle}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                  {history.length} / 5
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {history.length === 0 && (
                  <p className="text-white/60">{copy.historyEmpty}</p>
                )}
                {history.map((item, idx) => (
                  <div
                    key={`history-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-white/80"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-white/60">
                        {copy.linePrefix} {item.streak}x
                      </p>
                      <p className="font-semibold text-white">{item.message}</p>
                    </div>
                    <span
                      className={`text-sm font-bold ${item.win > 0 ? "text-emerald-300" : "text-white/60"
                        }`}
                    >
                      {formatCurrency(item.win)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-800/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="uppercase tracking-[0.2em] text-white/60">
                  {copy.paytableTitle}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-200">
                  {copy.paytableBadge}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {SYMBOLS.map((symbol) => (
                  <div
                    key={symbol.id}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${symbol.accent} text-xl shadow-[0_0_20px_rgba(0,0,0,0.35)]`}
                      >
                        {symbol.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {symbol.labels[locale]}
                        </p>
                        <p className="text-xs text-white/60">
                          {symbol.weight}% {copy.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-emerald-300">
                        x{symbol.multiplier.toFixed(1)}
                      </p>
                      <p className="text-[11px] text-white/60">{copy.winningsLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
