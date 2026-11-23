/**
 * EASYCONNECT - STORY SCROLL CONTROLLER (story-scroll.js)
 * 
 * - Minimal 7-step "How EasyConnect Works" flow
 * - Continuous SVG path connecting actual DOM coordinates of step waypoints
 * - Scroll-linked blood-drop mascot traveling along the path
 * - Exact alignment at each step, naturally reversible when scrolling upward
 * - Responsive auto-recalculation on resize & orientationchange
 * - Accessible FAQ accordion & Back-To-Top helpers
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. HOW EASYCONNECT WORKS - SCROLL-LINKED FLOW ENGINE
    // =========================================================================
    function initHowItWorksFlow() {
        const container = document.getElementById('stepsFlowContainer');
        const svg = document.getElementById('stepsFlowSvg');
        const pathBg = document.getElementById('flowPathBg');
        const pathFill = document.getElementById('flowPathFill');
        const mascot = document.getElementById('stepsFlowMascot');
        const stepItems = Array.from(document.querySelectorAll('.flow-step-item'));

        if (!container || !svg || !pathBg || !pathFill || !mascot || stepItems.length === 0) {
            return;
        }

        let waypoints = []; // [{ x, y, pageY, item }]
        let totalLength = 0;
        let stepLengths = []; // path length at each waypoint
        let stepScrollTriggers = []; // scroll Y where each step reaches reading view
        let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let ticking = false;

        // Binary search to find path length at a target Y coordinate (< 0.01px precision)
        function findLengthAtY(path, targetY, totalL) {
            let low = 0;
            let high = totalL;
            for (let i = 0; i < 18; i++) {
                const mid = (low + high) / 2;
                const pt = path.getPointAtLength(mid);
                if (pt.y < targetY) {
                    low = mid;
                } else {
                    high = mid;
                }
            }
            return (low + high) / 2;
        }

        // Calculate geometry from actual live DOM coordinates
        function calculateGeometry() {
            const containerRect = container.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            // 1. Measure real-time DOM coordinates of each waypoint relative to container
            waypoints = stepItems.map(item => {
                const dot = item.querySelector('.flow-step-waypoint');
                const dotRect = dot ? dot.getBoundingClientRect() : item.getBoundingClientRect();
                return {
                    x: (dotRect.left + dotRect.width / 2) - containerRect.left,
                    y: (dotRect.top + dotRect.height / 2) - containerRect.top,
                    pageY: dotRect.top + scrollTop + (dotRect.height / 2),
                    item: item
                };
            });

            if (waypoints.length === 0) return;

            // 2. Generate smooth SVG path connecting waypoints
            const isMobile = window.innerWidth < 768;
            let d = `M ${waypoints[0].x.toFixed(2)} ${waypoints[0].y.toFixed(2)}`;

            for (let i = 0; i < waypoints.length - 1; i++) {
                const curr = waypoints[i];
                const next = waypoints[i + 1];

                if (isMobile) {
                    // Straight vertical line down beside headings on mobile
                    d += ` L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
                } else {
                    // Smooth cubic Bezier S-curve on desktop
                    const dy = next.y - curr.y;
                    const cp1x = curr.x;
                    const cp1y = curr.y + dy * 0.5;
                    const cp2x = next.x;
                    const cp2y = next.y - dy * 0.5;
                    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
                }
            }

            pathBg.setAttribute('d', d);
            pathFill.setAttribute('d', d);

            totalLength = pathFill.getTotalLength();
            pathFill.style.strokeDasharray = `${totalLength.toFixed(2)} ${totalLength.toFixed(2)}`;
            pathFill.style.strokeDashoffset = `${totalLength.toFixed(2)}`;

            // 3. Find exact path length at each waypoint
            stepLengths = [0];
            for (let i = 1; i < waypoints.length - 1; i++) {
                const len = findLengthAtY(pathFill, waypoints[i].y, totalLength);
                stepLengths.push(len);
            }
            stepLengths.push(totalLength);

            // 4. Calculate scroll triggers: when each waypoint reaches 45% of viewport height
            const viewH = window.innerHeight;
            stepScrollTriggers = waypoints.map(wp => wp.pageY - viewH * 0.45);

            // 5. Update mascot & path fill immediately
            updateScrollProgress();
        }

        // Synchronize mascot & path fill with current scroll position
        function updateScrollProgress() {
            ticking = false;
            if (waypoints.length === 0 || totalLength === 0) return;

            const currentY = window.pageYOffset || document.documentElement.scrollTop;
            const numSteps = waypoints.length;

            let targetLength = 0;
            let activeIdx = 0;

            if (currentY <= stepScrollTriggers[0]) {
                targetLength = 0;
                activeIdx = 0;
            } else if (currentY >= stepScrollTriggers[numSteps - 1]) {
                targetLength = totalLength;
                activeIdx = numSteps - 1;
            } else {
                // Find current segment [segIdx, segIdx + 1]
                let segIdx = 0;
                for (let i = 0; i < numSteps - 1; i++) {
                    if (currentY >= stepScrollTriggers[i] && currentY <= stepScrollTriggers[i + 1]) {
                        segIdx = i;
                        break;
                    }
                }

                const y0 = stepScrollTriggers[segIdx];
                const y1 = stepScrollTriggers[segIdx + 1];
                const t = (y1 - y0) > 0 ? (currentY - y0) / (y1 - y0) : 0;

                const l0 = stepLengths[segIdx];
                const l1 = stepLengths[segIdx + 1];
                targetLength = l0 + t * (l1 - l0);

                activeIdx = t < 0.5 ? segIdx : segIdx + 1;
            }

            // Clamp length
            targetLength = Math.max(0, Math.min(totalLength, targetLength));

            // Position character mascot: optical center offset (width=34, optical Y ~20)
            const pt = pathFill.getPointAtLength(targetLength);
            const mascotX = pt.x - 17;
            const mascotY = pt.y - 20;

            if (isReducedMotion) {
                const activeWp = waypoints[activeIdx];
                mascot.style.transform = `translate3d(${(activeWp.x - 17).toFixed(1)}px, ${(activeWp.y - 20).toFixed(1)}px, 0)`;
            } else {
                mascot.style.transform = `translate3d(${mascotX.toFixed(2)}px, ${mascotY.toFixed(2)}px, 0)`;
            }

            // Update path fill stroke
            pathFill.style.strokeDashoffset = `${Math.max(0, totalLength - targetLength).toFixed(2)}`;

            // Update subtle active highlight on the current step only
            for (let i = 0; i < numSteps; i++) {
                if (i === activeIdx) {
                    stepItems[i].classList.add('is-active');
                } else {
                    stepItems[i].classList.remove('is-active');
                }
            }
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(updateScrollProgress);
                ticking = true;
            }
        }

        // Debounced resize & orientation listener
        let resizeTimer;
        function onResize() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                calculateGeometry();
            }, 100);
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener('orientationchange', onResize, { passive: true });

        // Initialize geometry when fonts and layout are ready
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(calculateGeometry);
        } else {
            setTimeout(calculateGeometry, 100);
        }
        calculateGeometry();
    }

    // =========================================================================
    // 2. ACCESSIBLE FAQ ACCORDION (PRESERVED)
    // =========================================================================
    function initFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-accordion-item');
        if (!faqItems.length) return;

        faqItems.forEach(item => {
            const trigger = item.querySelector('.faq-trigger');
            const panel = item.querySelector('.faq-panel');
            if (!trigger || !panel) return;

            trigger.addEventListener('click', () => {
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

                // Single-open accordion: close other panels
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherTrigger = otherItem.querySelector('.faq-trigger');
                        const otherPanel = otherItem.querySelector('.faq-panel');
                        if (otherTrigger && otherPanel) {
                            otherTrigger.setAttribute('aria-expanded', 'false');
                            otherItem.classList.remove('faq-open');
                            otherPanel.hidden = true;
                        }
                    }
                });

                // Toggle this panel
                if (isExpanded) {
                    trigger.setAttribute('aria-expanded', 'false');
                    item.classList.remove('faq-open');
                    panel.hidden = true;
                } else {
                    trigger.setAttribute('aria-expanded', 'true');
                    item.classList.add('faq-open');
                    panel.hidden = false;
                }
            });

            // Keyboard navigation
            trigger.addEventListener('keydown', (e) => {
                const triggers = Array.from(document.querySelectorAll('.faq-trigger'));
                const currentIndex = triggers.indexOf(trigger);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    triggers[(currentIndex + 1) % triggers.length].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    triggers[(currentIndex - 1 + triggers.length) % triggers.length].focus();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    triggers[0].focus();
                } else if (e.key === 'End') {
                    e.preventDefault();
                    triggers[triggers.length - 1].focus();
                }
            });
        });
    }

    // =========================================================================
    // 3. BACK TO TOP BUTTON (PRESERVED)
    // =========================================================================
    function initBackToTop() {
        const backToTopBtn = document.getElementById('backToTopBtn');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
                });
            });
        }
    }

    // =========================================================================
    // 4. BOOTSTRAP
    // =========================================================================
    function init() {
        initHowItWorksFlow();
        initFAQAccordion();
        initBackToTop();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
