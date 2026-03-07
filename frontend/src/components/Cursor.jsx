import { useEffect, useRef } from 'react';

export default function Cursor() {
    const dot = useRef(null);
    const ring = useRef(null);
    const pos = useRef({ x: -100, y: -100 });
    const rpos = useRef({ x: -100, y: -100 });
    const raf = useRef(null);

    useEffect(() => {
        const move = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('mousemove', move);

        // Lerp ring
        const tick = () => {
            rpos.current.x += (pos.current.x - rpos.current.x) * 0.12;
            rpos.current.y += (pos.current.y - rpos.current.y) * 0.12;
            if (dot.current) {
                dot.current.style.left = pos.current.x + 'px';
                dot.current.style.top = pos.current.y + 'px';
            }
            if (ring.current) {
                ring.current.style.left = rpos.current.x + 'px';
                ring.current.style.top = rpos.current.y + 'px';
            }
            raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);

        const onEnter = (e) => { if (e.target.closest('button,a,[data-hover]')) document.body.classList.add('cursor-hover'); };
        const onLeave = () => { document.body.classList.remove('cursor-hover'); };
        window.addEventListener('mouseover', onEnter);
        window.addEventListener('mouseout', onLeave);

        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseover', onEnter);
            window.removeEventListener('mouseout', onLeave);
            cancelAnimationFrame(raf.current);
        };
    }, []);

    return (
        <>
            <div id="cursor-dot" ref={dot} />
            <div id="cursor-ring" ref={ring} />
        </>
    );
}
