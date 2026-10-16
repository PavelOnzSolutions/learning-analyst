import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext.tsx';

const AnimatedBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { appearance, backgroundType, accentColor, useAccentColorForBackground } = useTheme();
    const animationRef = useRef<number>(0);
    const elementsRef = useRef<any[]>([]);
    const blobsRef = useRef<any[]>([]);
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
                elementsRef.current = Array.from({ length: 6 }, () => ({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 300 + 200,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    colorIndex: Math.floor(Math.random() * colors.length),
                }));
            } else if (backgroundType === 'starfield') {
                elementsRef.current = Array.from({ length: 400 }, () => ({
                    x: (Math.random() - 0.5) * canvas.width * 2,
                    y: (Math.random() - 0.5) * canvas.height * 2,
                    z: Math.random() * canvas.width,
                    pz: 0
                }));
                // Set pz for all stars initially to avoid first frame skip
                elementsRef.current.forEach(star => {
                    star.pz = star.z;
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

        const animate = () => {
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
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ filter: backgroundType === 'orbs' ? 'blur(60px)' : 'none' }}
        />
    );
};

export default AnimatedBackground;
