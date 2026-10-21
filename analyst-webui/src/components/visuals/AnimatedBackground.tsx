import { useEffect, useRef} from 'react';
import {useTheme} from '../../context/ThemeContext.tsx';
import {getHueFromAccentColor} from "../../utils/color-utils.ts";

const AnimatedBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {appearance, backgroundType, accentColor, useAccentColorForBackground} = useTheme();
    const animationRef = useRef<number>(0);
    const elementsRef = useRef<any[]>([]);
    const blobsRef = useRef<any[]>([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const mouseTargetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const getColors = () => {
            const rootStyle = getComputedStyle(document.documentElement);
            const getVar = (name: string, fallback: string) => {
                const val = rootStyle.getPropertyValue(name).trim();
                return val || fallback;
            };

            if (useAccentColorForBackground) {
                if (appearance === 'dark') {
                    return [
                        getVar(`--${accentColor}-a6`, 'rgba(40, 180, 240, 0.3)'),
                        getVar(`--${accentColor}-a4`, 'rgba(100, 200, 255, 0.2)'),
                        getVar(`--${accentColor}-a5`, 'rgba(0, 130, 180, 0.25)')
                    ];
                } else {
                    return [
                        getVar(`--${accentColor}-a4`, 'rgba(36, 143, 188, 0.15)'),
                        getVar(`--${accentColor}-a3`, 'rgba(90, 179, 222, 0.12)'),
                        getVar(`--${accentColor}-a2`, 'rgba(0, 131, 180, 0.14)')
                    ];
                }
            } else {
                // Default colors (blue-ish)
                if (appearance === 'dark') {
                    return [
                        'rgba(40, 180, 240, 0.3)',
                        'rgba(100, 200, 255, 0.2)',
                        'rgba(0, 130, 180, 0.25)'
                    ];
                } else {
                    return [
                        'rgba(36, 143, 188, 0.15)',
                        'rgba(90, 179, 222, 0.12)',
                        'rgba(0, 131, 180, 0.14)'
                    ];
                }
            }
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const init = () => {
            elementsRef.current = [];
            blobsRef.current = [];
            const colors = getColors();

            if (backgroundType === 'orbs') {
                elementsRef.current = Array.from({length: 6}, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 300 + 200,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    colorIndex: Math.floor(Math.random() * colors.length),
                }));
            } else if (backgroundType === 'starfield') {
                elementsRef.current = Array.from({length: 400}, () => ({
                    x: (Math.random() - 0.5) * canvas.width * 2,
                    y: (Math.random() - 0.5) * canvas.height * 2,
                    z: Math.random() * canvas.width,
                    pz: 0
                }));
                // Set pz for all stars initially to avoid first frame skip
                elementsRef.current.forEach(star => {
                    star.pz = star.z;
                });
            } else if (backgroundType === 'particles') {
                elementsRef.current = Array.from({ length: 70 }, () => {
                    // Depth skewed toward the far plane: many small distant specks, few large near ones.
                    const z = Math.pow(Math.random(), 1.8);
                    const angle = Math.random() * Math.PI * 2;
                    const speed = (0.04 + z * 0.22) * (0.6 + Math.random() * 0.8);
                    return {
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        z,
                        radius: 0.8 + z * 5.2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - (0.015 + z * 0.05),
                        phase: Math.random() * Math.PI * 2,
                        twinkleSpeed: 0.3 + Math.random() * 0.9,
                        colorIndex: Math.floor(Math.random() * colors.length)
                    };
                });
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseTargetRef.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1
            };
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        const animate = (time: number) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            getComputedStyle(document.documentElement);

            if (backgroundType === 'orbs') {
                elementsRef.current.forEach((orb) => {
                    orb.x += orb.vx;
                    orb.y += orb.vy;
                    if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius;
                    if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius;
                    if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius;
                    if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius;

                    const colors = getColors();
                    const color = colors[orb.colorIndex] || colors[0];

                    const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, 'transparent');
                    ctx.beginPath();
                    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                });
            } else if (backgroundType === 'starfield') {
                ctx.fillStyle = appearance === 'dark' ? '#000' : '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const speed = 4;

                const rootStyle = getComputedStyle(document.documentElement);
                const starColor = useAccentColorForBackground
                    ? rootStyle.getPropertyValue(`--${accentColor}-11`).trim() || (appearance === 'dark' ? '#fff' : '#000')
                    : (appearance === 'dark' ? '#fff' : '#000');

                elementsRef.current.forEach(star => {
                    star.z -= speed;
                    if (star.z <= 0) {
                        star.z = canvas.width;
                        star.x = (Math.random() - 0.5) * canvas.width * 2;
                        star.y = (Math.random() - 0.5) * canvas.height * 2;
                        star.pz = star.z;
                    }

                    const sx = (star.x / star.z) * canvas.width + centerX;
                    const sy = (star.y / star.z) * canvas.height + centerY;

                    if (star.pz > 0) {
                        const px = (star.x / star.pz) * canvas.width + centerX;
                        const py = (star.y / star.pz) * canvas.height + centerY;

                        // Check if at least one point is on screen
                        if ((sx >= 0 && sx <= canvas.width && sy >= 0 && sy <= canvas.height) ||
                            (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height)) {
                            const r = (1 - star.z / canvas.width) * 2;
                            ctx.beginPath();
                            ctx.strokeStyle = starColor;
                            ctx.lineWidth = r;
                            ctx.moveTo(px, py);
                            ctx.lineTo(sx, sy);
                            ctx.stroke();
                        }
                    }
                    star.pz = star.z;
                });
            } else if (backgroundType === 'particles') {
                const colors = getColors();
                const t = time * 0.001;

                // Smooth the raw pointer position toward its target for a gentle parallax drift.
                mouseRef.current.x += (mouseTargetRef.current.x - mouseRef.current.x) * 0.04;
                mouseRef.current.y += (mouseTargetRef.current.y - mouseRef.current.y) * 0.04;

                ctx.globalCompositeOperation = 'lighter';

                // Pass 1: advance motion and cache each particle's on-screen draw position.
                elementsRef.current.forEach((p) => {
                    p.x += p.vx;
                    p.y += p.vy;

                    // Drift particles across the whole plane instead of bouncing off edges.
                    const margin = p.radius * 4 + 20;
                    if (p.x < -margin) p.x = canvas.width + margin;
                    if (p.x > canvas.width + margin) p.x = -margin;
                    if (p.y < -margin) p.y = canvas.height + margin;
                    if (p.y > canvas.height + margin) p.y = -margin;

                    // Nearer (larger) particles shift more with the pointer than distant ones.
                    const parallax = p.z * 45;
                    p.drawX = p.x + mouseRef.current.x * parallax;
                    p.drawY = p.y + mouseRef.current.y * parallax * 0.6;

                    const twinkle = 0.65 + 0.35 * Math.sin(t * p.twinkleSpeed + p.phase);
                    p.alpha = (0.45 + p.z * 0.9) * twinkle;
                });

                // Pass 2: connect nearby particles, favoring the near depth plane so links read
                // as threads between foreground motes rather than a flat distant mesh.
                const linkDistance = 140;
                for (let i = 0; i < elementsRef.current.length; i++) {
                    const p1 = elementsRef.current[i];
                    for (let j = i + 1; j < elementsRef.current.length; j++) {
                        const p2 = elementsRef.current[j];
                        const dx = p1.drawX - p2.drawX;
                        const dy = p1.drawY - p2.drawY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < linkDistance) {
                            const depthFactor = (p1.z + p2.z) / 2;
                            const proximity = 1 - dist / linkDistance;
                            const lineAlpha = proximity * proximity * (0.35 + depthFactor * 0.85);
                            if (lineAlpha < 0.01) continue;
                            ctx.globalAlpha = lineAlpha;
                            ctx.strokeStyle = colors[p1.colorIndex] || colors[0];
                            ctx.lineWidth = 0.6 + depthFactor * 1.2;
                            ctx.beginPath();
                            ctx.moveTo(p1.drawX, p1.drawY);
                            ctx.lineTo(p2.drawX, p2.drawY);
                            ctx.stroke();
                        }
                    }
                }

                // Pass 3: draw each particle's glow on top of the links.
                elementsRef.current.forEach((p) => {
                    const color = colors[p.colorIndex] || colors[0];

                    // Soft halo: bigger and softer for near particles, giving an out-of-focus bokeh feel.
                    const glowRadius = p.radius * (2.2 + p.z * 2.5);
                    const gradient = ctx.createRadialGradient(p.drawX, p.drawY, 0, p.drawX, p.drawY, glowRadius);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, 'transparent');
                    ctx.globalAlpha = Math.min(1, p.alpha);
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.drawX, p.drawY, glowRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Bright core so distant particles still read as crisp pinpoints of light.
                    ctx.globalAlpha = Math.min(1, p.alpha * 2);
                    ctx.beginPath();
                    ctx.arc(p.drawX, p.drawY, p.radius * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                });

                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [appearance, backgroundType, accentColor, useAccentColorForBackground]);

    return (
        <>
            {backgroundType === 'glyphs' && (
                <div className="fixed inset-0 pointer-events-none z-0" style={{ opacity: `${appearance === 'dark' ? 0.75 : 0.5}`, transition: 'opacity 1s ease-in-out' }}>
                    <div className="auth-orbs-layer auth-orbs-layer-back absolute inset-0 bg-center bg-cover" style={{ backgroundImage: 'url(/assets/images/bg-auth-2.jpg)' }} />
                    <div className="auth-orbs-layer auth-orbs-layer-mid absolute inset-0 bg-center bg-cover" style={{ backgroundImage: 'url(/assets/images/bg-auth-2.jpg)' }} />
                    <div className="auth-orbs-layer auth-orbs-layer-front absolute inset-0 bg-center bg-cover" style={{ backgroundImage: 'url(/assets/images/bg-auth-2.jpg)' }} />
                    <div className="auth-orbs-mist absolute inset-0" />
                    <div
                        className="absolute inset-0 pointer-events-none transition ease-in-out duration-1300"
                        style={{
                            backgroundColor: `hsl(${getHueFromAccentColor(accentColor)} 85% 52% / 0.25)`,
                            mixBlendMode: 'multiply',
                        }}
                    />
                </div>
            )};
            
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-0"
                style={{filter: backgroundType === 'orbs' ? 'blur(60px)' : 'none'}}
            />
        </>
    );
};

export default AnimatedBackground;
