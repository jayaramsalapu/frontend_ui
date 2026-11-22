/**
 * EasyConnect — Full Hero Section Interactive 3D Background
 * Features:
 * - Full-Viewport Background Canvas: Stretches across the entire .hero-viewport background.
 * - Cute, Vibrant Red Blood-Drop Mascot:
 *     Glossy clearcoat, white medical headband, heart badge, rosy cheeks, cheek bandaid,
 *     large glossy cartoon eyes with shiny reflection highlights, and realistic bipedal walking physics.
 * - Less Shiny Heart:
 *     Soft organic velvety/matte surface (roughness: 0.58, clearcoat: 0, no plastic shine).
 * - From Dull to Bright With Heart Beats:
 *     Dull & dormant initially (muted dark wine-red, 0 emissive glow, asleep).
 *     As the mascot presents the droplet, the heart transforms from dull to bright living red.
 *     With Heart Beats: Pumps with an authentic dual-phase "lub-dub" cardiac rhythm (~60 BPM),
 *     flashing bright surges of light with each systolic contraction and emitting soft red energy rings.
 * - Unrushed, realistic animation pacing (~24s natural story loop).
 */

(function () {
    let scene, camera, renderer;
    let stageGroup, mascotGroup, mascotBodyMesh, leftFootMesh, rightFootMesh, leftHandMesh, rightHandMesh;
    let leftEyePupil, rightEyePupil, leftHighlightMajor, leftHighlightMinor, rightHighlightMajor, rightHighlightMinor;
    let heldDropletGroup, heldDropletMesh, heldDropletHalo;
    let bigHeartGroup, bigHeartMesh, bigHeartInnerCore, bigHeartAura;
    let gatheringParticles = [], radiatingParticles = [], heartPulseWaves = [];
    let mascotShadowDisc, heartShadowDisc;
    let startX = -4.6, heartX = 4.6, endX = 2.4;

    // Director & Pacing State (Unhurried, realistic pacing)
    let storyLoopProgress = 0.05;
    let targetLoopProgress = 0.05;
    let currentAct = 0;
    let lockedAct = null;
    let lockTimer = null;
    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    let clock = null; // Constructed safely inside init() after THREE availability guard
    let isUserPaused = false;
    let isHeroVisible = true;
    let isDocHidden = false;
    let animFrameId = null;
    let isLoopRunning = false;
    let isReducedMotion = false;
    let scratchVecTarget = null;
    let scratchVecPos = null;
    let dullHeartColor = null;
    let brightHeartColor = null;
    let brightHeartEmissive = null;

    const storyVars = {
        dropletCharge: 0.28,
        mascotWalkProgress: 0.0,
        heartAwaken: 0.0
    };

    // Helper: Soft Radial Glow Texture
    function createGlowTexture(hexColor) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, hexColor);
        grad.addColorStop(0.4, hexColor + '88');
        grad.addColorStop(0.8, hexColor + '22');
        grad.addColorStop(1, hexColor + '00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(canvas);
    }

    // Helper: 3D Teardrop Lathe Geometry
    function createTeardropGeometry(radius = 0.82, height = 2.15) {
        const points = [];
        const segments = 40;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = (t - 0.38) * height;
            // Cute plump droplet profile
            const r = radius * Math.sin(t * Math.PI) * Math.pow(1 - t, 0.42) * 1.48;
            points.push(new THREE.Vector2(Math.max(0.001, r), y));
        }
        const geo = new THREE.LatheGeometry(points, 48);
        geo.computeVertexNormals();
        return geo;
    }

    // Helper: 3D Extruded Heart Geometry
    function createHeartGeometry(scale = 1.0, depth = 0.45) {
        const shape = new THREE.Shape();
        const x = 0, y = 0;
        shape.moveTo(x, y + 0.35);
        shape.bezierCurveTo(x, y + 0.35, x - 0.08, y, x - 0.45, y);
        shape.bezierCurveTo(x - 0.95, y, x - 0.95, y + 0.62, x - 0.95, y + 0.62);
        shape.bezierCurveTo(x - 0.95, y + 0.98, x - 0.58, y + 1.32, x, y + 1.65);
        shape.bezierCurveTo(x + 0.58, y + 1.32, x + 0.95, y + 0.98, x + 0.95, y + 0.62);
        shape.bezierCurveTo(x + 0.95, y + 0.62, x + 0.95, y, x + 0.45, y);
        shape.bezierCurveTo(x + 0.15, y, x, y + 0.35, x, y + 0.35);

        const extrudeSettings = {
            depth: depth,
            bevelEnabled: true,
            bevelSegments: 14,
            steps: 2,
            bevelSize: 0.16,
            bevelThickness: 0.16
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        geo.rotateZ(Math.PI);
        geo.scale(scale, scale, scale);
        geo.computeVertexNormals();
        return geo;
    }

    function init() {
        const heroSection = document.querySelector('.hero-viewport') || document.getElementById('home');
        const canvas = document.getElementById('hero-3d-canvas');
        if (!heroSection || !canvas) return;

        // Mobile Guard: strictly do not initialize or run 3D WebGL on mobile (767px and below)
        if (window.innerWidth <= 767) {
            canvas.style.display = 'none';
            const pauseBtn = document.getElementById('hero3dPauseBtn');
            if (pauseBtn) pauseBtn.style.display = 'none';
            // Listen for window resize in case window width increases to desktop
            window.addEventListener('resize', () => {
                if (!scene && window.innerWidth > 767 && typeof THREE !== 'undefined') {
                    init();
                }
            }, { passive: true });
            return;
        }

        // Strict THREE availability guard before constructing any THREE object
        if (typeof THREE === 'undefined') {
            console.warn("Three.js library is not available. Showing static fallback.");
            showFallbackIllustration(heroSection);
            return;
        }

        // Safe Clock construction after THREE guard
        clock = new THREE.Clock();
        scratchVecTarget = new THREE.Vector3();
        scratchVecPos = new THREE.Vector3();
        dullHeartColor = new THREE.Color(0x6E2424);
        brightHeartColor = new THREE.Color(0xD42B1E);
        brightHeartEmissive = new THREE.Color(0xCC1A0A);

        const canvasContainer = document.querySelector('.hero-canvas-frame') || document.getElementById('bg-canvas-container') || heroSection;
        const width = canvasContainer.clientWidth || 550;
        const height = canvasContainer.clientHeight || 420;

        // 1. Scene & Warm Camera Setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xF8F9F5);
        scene.fog = new THREE.FogExp2(0xF8F9F5, 0.018);

        camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
        camera.position.set(0, 0.28, 8.2);
        camera.lookAt(0, 0.05, 0);

        // 2. Renderer with ACES Filmic Tone Mapping and WebGL error handling
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                powerPreference: 'high-performance'
            });
        } catch (err) {
            console.warn("WebGL initialization failed, showing fallback illustration.", err);
            showFallbackIllustration(heroSection);
            return;
        }

        if (!renderer || !renderer.getContext()) {
            console.warn("WebGL context not available, showing fallback illustration.");
            showFallbackIllustration(heroSection);
            return;
        }

        renderer.setSize(width, height);
        const maxDpr = width < 768 ? 1.25 : 1.75;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        // 3. Balanced Warm Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xFFF7F0, 0.88);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xFFFAF5, 1.2);
        keyLight.position.set(5, 8, 7);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xFFEDE4, 0.6);
        fillLight.position.set(-6, 4, 3);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xFFDDD2, 0.75);
        rimLight.position.set(0, 4, -5);
        scene.add(rimLight);

        // 4. Main Stage Group (Holding Mascot, Heart, and Particles)
        stageGroup = new THREE.Group();
        scene.add(stageGroup);

        // Ground Contact Shadows
        const shadowTex = createGlowTexture('#DAC5BA');
        mascotShadowDisc = new THREE.Mesh(
            new THREE.PlaneGeometry(1.9, 1.05),
            new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.40, depthWrite: false })
        );
        mascotShadowDisc.rotation.x = -Math.PI / 2;
        mascotShadowDisc.position.set(startX, -1.35, 0);
        stageGroup.add(mascotShadowDisc);

        heartShadowDisc = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 1.25),
            new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.36, depthWrite: false })
        );
        heartShadowDisc.rotation.x = -Math.PI / 2;
        heartShadowDisc.position.set(heartX, -1.35, 0);
        stageGroup.add(heartShadowDisc);

        // Build Scene Elements
        buildMascot();
        buildHeart();
        buildParticles();

        // Responsive Stage Placement
        updateLayout();

        // Check initial reduced motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        isReducedMotion = motionQuery.matches;

        motionQuery.addEventListener('change', (e) => {
            isReducedMotion = e.matches;
            if (isReducedMotion) {
                renderStaticComposedScene();
            } else if (isHeroVisible && !isDocHidden && !isUserPaused) {
                resumeLoop();
            }
        });

        // Accessible Pause / Resume button
        const pauseBtn = document.getElementById('hero3dPauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                isUserPaused = !isUserPaused;
                pauseBtn.setAttribute('aria-pressed', String(isUserPaused));
                const newLabel = isUserPaused ? 'Resume 3D animation' : 'Pause 3D animation';
                pauseBtn.setAttribute('title', newLabel);
                pauseBtn.setAttribute('aria-label', newLabel);
                const icon = pauseBtn.querySelector('i');
                if (icon) {
                    icon.className = isUserPaused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
                }
                const srText = pauseBtn.querySelector('.sr-only');
                if (srText) srText.textContent = newLabel;

                if (isUserPaused) {
                    pauseLoop();
                } else {
                    resumeLoop();
                }
            });
        }

        // Pause when document is hidden
        document.addEventListener('visibilitychange', () => {
            isDocHidden = document.hidden;
            if (isDocHidden) {
                pauseLoop();
            } else if (!isUserPaused && isHeroVisible && !isReducedMotion) {
                resumeLoop();
            }
        });

        // Pause when hero viewport is off-screen
        if ('IntersectionObserver' in window) {
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isHeroVisible = entry.isIntersecting;
                    if (isHeroVisible) {
                        if (!isUserPaused && !isDocHidden && !isReducedMotion) {
                            resumeLoop();
                        }
                    } else {
                        pauseLoop();
                    }
                });
            }, { threshold: 0.05 });
            heroObserver.observe(heroSection);
        }

        // Mouse Parallax & Interaction (passive, disabled during reduced motion)
        window.addEventListener('mousemove', (e) => {
            if (isReducedMotion) return;
            targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
            targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        }, { passive: true });

        // Resize Listener
        window.addEventListener('resize', updateLayout, { passive: true });

        // Start render loop or static scene based on preference
        if (isReducedMotion) {
            renderStaticComposedScene();
        } else {
            isLoopRunning = true;
            animate();
        }
    }

    function updateLayout() {
        if (window.innerWidth <= 767) {
            pauseLoop();
            const canvas = document.getElementById('hero-3d-canvas');
            if (canvas) canvas.style.display = 'none';
            const pauseBtn = document.getElementById('hero3dPauseBtn');
            if (pauseBtn) pauseBtn.style.display = 'none';
            return;
        }

        if (!scene) {
            if (typeof THREE !== 'undefined') {
                init();
            }
            return;
        }

        const canvas = document.getElementById('hero-3d-canvas');
        if (canvas) canvas.style.display = 'block';
        const pauseBtn = document.getElementById('hero3dPauseBtn');
        if (pauseBtn && !isUserPaused) pauseBtn.style.display = 'inline-flex';

        const canvasContainer = document.querySelector('.hero-canvas-frame') || document.getElementById('bg-canvas-container') || document.querySelector('.hero-viewport');
        if (!canvasContainer || !renderer || !camera || !stageGroup) return;

        const width = canvasContainer.clientWidth || 550;
        const height = canvasContainer.clientHeight || 420;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        // Center stage horizontally, position at comfortable vertical height
        if (width >= 1024) {
            stageGroup.position.set(0, 0.04, 0);
            stageGroup.scale.set(0.66, 0.66, 0.66);
        } else {
            stageGroup.position.set(0, -0.04, -0.2);
            stageGroup.scale.set(0.58, 0.58, 0.58);
        }

        // Dynamically compute positions so character is placed at left end of stage
        // and heart is placed at right end of stage
        const aspect = width / height;
        const fovRad = (camera.fov * Math.PI) / 180;
        const halfH = Math.tan(fovRad / 2) * camera.position.z;
        const halfW = halfH * aspect;
        const sScale = stageGroup.scale.x || 0.66;
        const stageHalfW = halfW / sScale;

        startX = -Math.max(2.6, Math.min(4.8, stageHalfW * 0.72));
        heartX = Math.max(2.6, Math.min(4.8, stageHalfW * 0.72));
        endX = heartX - 2.0;

        if (bigHeartGroup) {
            bigHeartGroup.position.x = heartX;
        }
        if (heartShadowDisc) {
            heartShadowDisc.position.x = heartX;
        }

        if (!isUserPaused && isHeroVisible && !isDocHidden && !isReducedMotion) {
            resumeLoop();
        }
    }

    // -------------------------------------------------------------------------
    // FALLBACK & LOOP LIFECYCLE MANAGEMENT
    // -------------------------------------------------------------------------
    function showFallbackIllustration(heroSection) {
        if (!heroSection) return;
        const canvas = document.getElementById('hero-3d-canvas');
        if (canvas) canvas.style.display = 'none';
        const pauseBtn = document.getElementById('hero3dPauseBtn');
        if (pauseBtn) pauseBtn.style.display = 'none';

        let fallbackContainer = heroSection.querySelector('.hero-3d-fallback');
        if (!fallbackContainer) {
            fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'hero-3d-fallback';
            fallbackContainer.setAttribute('aria-hidden', 'true');
            fallbackContainer.innerHTML = `
                <div class="fallback-scene">
                    <div class="fallback-mascot">
                        <div class="fallback-droplet">
                            <span class="fallback-headband">♥</span>
                            <div class="fallback-face">
                                <span class="eye"></span><span class="eye"></span>
                            </div>
                            <div class="fallback-cheeks">
                                <span class="cheek"></span><span class="cheek"></span>
                            </div>
                        </div>
                        <div class="fallback-shadow"></div>
                    </div>
                    <div class="fallback-heart">
                        <svg viewBox="0 0 100 90" class="fallback-heart-svg" width="90" height="80">
                            <path d="M50,85 C20,60 5,42 5,26 C5,12 16,3 30,3 C38,3 46,7 50,14 C54,7 62,3 70,3 C84,3 95,12 95,26 C95,42 80,60 50,85 Z" fill="#D42B1E"/>
                        </svg>
                        <div class="fallback-shadow heart-shadow"></div>
                    </div>
                </div>
            `;
            const bgContainer = heroSection.querySelector('.bg-canvas-container') || heroSection;
            bgContainer.appendChild(fallbackContainer);
        }
    }

    function pauseLoop() {
        isLoopRunning = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    function resumeLoop() {
        if (isLoopRunning || isUserPaused || isDocHidden || !isHeroVisible || isReducedMotion) return;
        if (clock) {
            clock.getDelta(); // Flush delta so timeline doesn't leap forward
        }
        isLoopRunning = true;
        animate();
    }

    function renderStaticComposedScene() {
        pauseLoop();
        if (!renderer || !scene || !camera) return;

        storyVars.dropletCharge = 0.95;
        storyVars.mascotWalkProgress = 0.45;
        storyVars.heartAwaken = 0.85;

        const mascotX = startX + 0.45 * (endX - startX);
        if (mascotGroup) {
            mascotGroup.position.set(mascotX, -0.32, 0);
            mascotGroup.rotation.set(0, 0, 0);
        }
        if (mascotShadowDisc) {
            mascotShadowDisc.position.set(mascotX, -1.35, 0);
        }
        if (heldDropletGroup) {
            heldDropletGroup.scale.setScalar(0.95);
        }
        if (bigHeartGroup) {
            bigHeartGroup.scale.setScalar(1.0);
            bigHeartGroup.position.y = -0.10;
            bigHeartGroup.rotation.y = -0.18;
        }
        if (bigHeartMesh) {
            if (brightHeartColor) bigHeartMesh.material.color.copy(brightHeartColor);
            if (brightHeartEmissive) bigHeartMesh.material.emissive.copy(brightHeartEmissive);
            bigHeartMesh.material.emissiveIntensity = 0.55;
        }
        if (bigHeartInnerCore) {
            bigHeartInnerCore.material.opacity = 0.35;
        }
        if (bigHeartAura) {
            bigHeartAura.material.opacity = 0.20;
        }

        camera.position.set(0, 0.28, 8.2);
        camera.lookAt(0, 0.05, 0);
        renderer.render(scene, camera);
    }

    // -------------------------------------------------------------------------
    // A. BUILD CUTE VIBRANT RED MASCOT CHARACTER
    // -------------------------------------------------------------------------
    function buildMascot() {
        mascotGroup = new THREE.Group();
        mascotGroup.position.set(startX, -0.32, 0);
        stageGroup.add(mascotGroup);

        // 1. Rich, Vibrant Red Droplet Body (#D42B1E) — Glossy & Saturated
        const bodyGeo = createTeardropGeometry(0.82, 2.15);
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: 0xD42B1E,            // Deep, vibrant red
            emissive: 0x540602,         // Subtle inner red glow prevents dull shadows
            emissiveIntensity: 0.22,
            roughness: 0.16,
            metalness: 0.02,
            clearcoat: 0.95,
            clearcoatRoughness: 0.08,
            reflectivity: 0.85
        });
        mascotBodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        mascotGroup.add(mascotBodyMesh);

        // 2. White Medical Headband
        const bandGeo = new THREE.CylinderGeometry(0.66, 0.74, 0.22, 40, 1, true);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.32, side: THREE.DoubleSide });
        const headband = new THREE.Mesh(bandGeo, bandMat);
        headband.position.set(0, 0.28, 0);
        headband.rotation.x = 0.05;
        mascotGroup.add(headband);

        // 3. Central Circular White Emblem with Red Heart
        const badgeDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(0.20, 0.20, 0.05, 32),
            new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.22 })
        );
        badgeDisc.rotation.x = Math.PI / 2;
        badgeDisc.position.set(0, 0.28, 0.71);
        mascotGroup.add(badgeDisc);

        const badgeHeart = new THREE.Mesh(
            createHeartGeometry(0.12, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xD42B1E, roughness: 0.2 })
        );
        badgeHeart.position.set(0, 0.28, 0.75);
        mascotGroup.add(badgeHeart);

        // 4. Large Cute Soulful Eyes with Glossy Highlights
        const eyeWhiteGeo = new THREE.SphereGeometry(0.16, 24, 24);
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.18 });

        const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        leftEyeWhite.position.set(-0.25, -0.05, 0.71);
        mascotGroup.add(leftEyeWhite);

        const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        rightEyeWhite.position.set(0.25, -0.05, 0.71);
        mascotGroup.add(rightEyeWhite);

        const pupilGeo = new THREE.SphereGeometry(0.09, 20, 20);
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1A1E1C, roughness: 0.1 });

        leftEyePupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftEyePupil.position.set(-0.24, -0.06, 0.78);
        mascotGroup.add(leftEyePupil);

        rightEyePupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightEyePupil.position.set(0.27, -0.06, 0.78);
        mascotGroup.add(rightEyePupil);

        // Specular Highlights for lively cartoon eyes
        const hlGeoMajor = new THREE.SphereGeometry(0.032, 12, 12);
        const hlGeoMinor = new THREE.SphereGeometry(0.016, 10, 10);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

        leftHighlightMajor = new THREE.Mesh(hlGeoMajor, hlMat);
        leftHighlightMajor.position.set(-0.22, -0.03, 0.85);
        mascotGroup.add(leftHighlightMajor);

        leftHighlightMinor = new THREE.Mesh(hlGeoMinor, hlMat);
        leftHighlightMinor.position.set(-0.26, -0.08, 0.85);
        mascotGroup.add(leftHighlightMinor);

        rightHighlightMajor = new THREE.Mesh(hlGeoMajor, hlMat);
        rightHighlightMajor.position.set(0.29, -0.03, 0.85);
        mascotGroup.add(rightHighlightMajor);

        rightHighlightMinor = new THREE.Mesh(hlGeoMinor, hlMat);
        rightHighlightMinor.position.set(0.25, -0.08, 0.85);
        mascotGroup.add(rightHighlightMinor);

        // 5. Rosy Cheeks & Right Cheek Band-Aid
        const cheekGeo = new THREE.SphereGeometry(0.105, 16, 16);
        cheekGeo.scale(1.25, 0.72, 0.45);
        const cheekMat = new THREE.MeshBasicMaterial({ color: 0xFF7262, transparent: true, opacity: 0.7 });

        const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
        leftCheek.position.set(-0.42, -0.21, 0.67);
        mascotGroup.add(leftCheek);

        const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
        rightCheek.position.set(0.42, -0.21, 0.67);
        mascotGroup.add(rightCheek);

        const bandage = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.10, 0.03),
            new THREE.MeshStandardMaterial({ color: 0xE8BFA4, roughness: 0.55 })
        );
        bandage.position.set(0.36, -0.18, 0.73);
        bandage.rotation.set(0.1, 0.35, -0.42);
        mascotGroup.add(bandage);

        // 6. Sweet Smile Curve
        const smileCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.08, -0.23, 0.80),
            new THREE.Vector3(0, -0.27, 0.82),
            new THREE.Vector3(0.08, -0.23, 0.80)
        ]);
        const smileMesh = new THREE.Mesh(
            new THREE.TubeGeometry(smileCurve, 16, 0.02, 8, false),
            new THREE.MeshStandardMaterial({ color: 0x540E07, roughness: 0.4 })
        );
        mascotGroup.add(smileMesh);

        // 7. Cute Droplet Feet & Cradling Hands
        const stubGeo = new THREE.SphereGeometry(0.17, 24, 24);
        stubGeo.scale(1.15, 0.82, 1.15);

        leftFootMesh = new THREE.Mesh(stubGeo, bodyMat);
        leftFootMesh.position.set(-0.38, -0.90, 0.15);
        mascotGroup.add(leftFootMesh);

        rightFootMesh = new THREE.Mesh(stubGeo, bodyMat);
        rightFootMesh.position.set(0.38, -0.90, 0.15);
        mascotGroup.add(rightFootMesh);

        const handGeo = new THREE.SphereGeometry(0.14, 24, 24);
        handGeo.scale(1.1, 0.88, 1.15);

        leftHandMesh = new THREE.Mesh(handGeo, bodyMat);
        leftHandMesh.position.set(0.42, -0.32, 0.58);
        mascotGroup.add(leftHandMesh);

        rightHandMesh = new THREE.Mesh(handGeo, bodyMat);
        rightHandMesh.position.set(0.70, -0.32, 0.30);
        mascotGroup.add(rightHandMesh);

        // 8. Luminous Blood Drop Held in Hands
        heldDropletGroup = new THREE.Group();
        heldDropletGroup.position.set(0.60, -0.12, 0.45);
        mascotGroup.add(heldDropletGroup);

        const miniDropGeo = createTeardropGeometry(0.22, 0.58);
        const miniDropMat = new THREE.MeshPhysicalMaterial({
            color: 0xE63926,
            emissive: 0xFF2A15,
            emissiveIntensity: 0.85,
            roughness: 0.1,
            clearcoat: 1.0,
            transparent: true,
            opacity: 0.95
        });
        heldDropletMesh = new THREE.Mesh(miniDropGeo, miniDropMat);
        heldDropletGroup.add(heldDropletMesh);

        const dropHaloTex = createGlowTexture('#FF482A');
        heldDropletHalo = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: dropHaloTex,
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending
            })
        );
        heldDropletHalo.scale.set(0.95, 0.95, 1);
        heldDropletGroup.add(heldDropletHalo);
    }

    // -------------------------------------------------------------------------
    // B. BUILD LESS SHINY HEART (FROM DULL TO BRIGHT WITH HEART BEATS)
    // -------------------------------------------------------------------------
    function buildHeart() {
        bigHeartGroup = new THREE.Group();
        bigHeartGroup.position.set(heartX, -0.10, -0.1);
        stageGroup.add(bigHeartGroup);

        // Less shiny, velvety/matte organic surface (NO plastic/glass clearcoat)
        const heartGeo = createHeartGeometry(1.22, 0.46);
        const heartMat = new THREE.MeshPhysicalMaterial({
            color: 0x6E2424,            // Starts in DULL, dormant wine-red
            emissive: 0x000000,         // Zero emissive initially (completely dull/asleep)
            emissiveIntensity: 0.0,
            roughness: 0.58,            // Organic matte velvety finish (NOT shiny!)
            metalness: 0.0,
            clearcoat: 0.0,             // No glossy clearcoat
            clearcoatRoughness: 0.5,
            transparent: true,
            opacity: 0.98
        });
        bigHeartMesh = new THREE.Mesh(heartGeo, heartMat);
        bigHeartGroup.add(bigHeartMesh);

        // Inner Luminescent Core (Appears as it transitions from dull to bright)
        const innerGeo = createHeartGeometry(0.84, 0.28);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xFF3322,
            transparent: true,
            opacity: 0.0                // Dark inside initially
        });
        bigHeartInnerCore = new THREE.Mesh(innerGeo, innerMat);
        bigHeartGroup.add(bigHeartInnerCore);

        // Warm Soft Red Radial Aura Sprite (Emerges when awakened)
        const heartAuraTex = createGlowTexture('#E52515');
        bigHeartAura = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: heartAuraTex,
                transparent: true,
                opacity: 0.0,           // Dormant initially
                depthWrite: false
            })
        );
        bigHeartAura.scale.set(2.8, 2.8, 1);
        bigHeartAura.position.set(0, 0, -0.38);
        bigHeartGroup.add(bigHeartAura);

        // Expanding Crimson Pulse Ring
        const waveGeo = new THREE.RingGeometry(1.22, 1.28, 64);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0xD42B1E,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.position.z = -0.2;
        bigHeartGroup.add(waveMesh);
        heartPulseWaves.push({ mesh: waveMesh, offset: 0 });
    }

    // -------------------------------------------------------------------------
    // C. BUILD GENTLE, UNHURRIED PARTICLE SYSTEMS
    // -------------------------------------------------------------------------
    function buildParticles() {
        // 1. Gathering Embers (Gentle particles drifting in from all directions into mascot's hands)
        const gatherGeo = new THREE.SphereGeometry(0.048, 12, 12);
        const colors = [0xD42B1E, 0xFF5722, 0xFF8A65, 0xFFA726];

        for (let i = 0; i < 26; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.7
            });
            const mesh = new THREE.Mesh(gatherGeo, mat);

            const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.4;
            const radius = 2.0 + Math.random() * 2.8;
            const startPos = new THREE.Vector3(
                Math.cos(angle) * radius + startX,
                Math.sin(angle) * (radius * 0.6) + (Math.random() - 0.5) * 1.3,
                (Math.random() - 0.5) * 1.8
            );

            stageGroup.add(mesh);
            gatheringParticles.push({
                mesh,
                startPos,
                phaseOffset: Math.random(),
                swirlFreq: 1.1 + Math.random() * 1.2,
                baseScale: 0.5 + Math.random() * 0.5
            });
        }

        // 2. Radiating Warm Heart Sparks (Softly floating outward during cardiac beats)
        const radGeo = new THREE.SphereGeometry(0.042, 10, 10);
        for (let i = 0; i < 16; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? 0xFF8A65 : 0xD42B1E,
                transparent: true,
                opacity: 0
            });
            const mesh = new THREE.Mesh(radGeo, mat);
            const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const dir = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle) * 0.85,
                (Math.random() - 0.5) * 0.5
            ).normalize();

            bigHeartGroup.add(mesh);
            radiatingParticles.push({
                mesh,
                dir,
                speed: 1.0 + Math.random() * 0.8,
                phaseOffset: i / 16,
                baseScale: 0.5 + Math.random() * 0.45
            });
        }
    }

    // -------------------------------------------------------------------------
    // D. STORY STATE MANAGEMENT
    // -------------------------------------------------------------------------
    window.setHeroStoryAct = function (actIdx) {
        currentAct = actIdx;
        lockedAct = actIdx;
        if (actIdx === 0) targetLoopProgress = 0.12;
        else if (actIdx === 1) targetLoopProgress = 0.50;
        else if (actIdx === 2) targetLoopProgress = 0.82;

        if (lockTimer) clearTimeout(lockTimer);
        lockTimer = setTimeout(() => {
            lockedAct = null;
        }, 5500);
    };

    // -------------------------------------------------------------------------
    // E. MAIN ANIMATION LOOP (Realistic, Unrushed Pacing)
    // -------------------------------------------------------------------------
    function animate() {
        if (!isLoopRunning || isUserPaused || isDocHidden || !isHeroVisible || isReducedMotion) {
            isLoopRunning = false;
            return;
        }
        animFrameId = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();

        // Smooth mouse dampening for 3D parallax (disabled if reduced motion)
        if (!isReducedMotion) {
            mouseX += (targetMouseX - mouseX) * 0.04;
            mouseY += (targetMouseY - mouseY) * 0.04;
        }

        // Smooth, unhurried timeline advancement (natural ~25 second loop)
        const loopSpeed = 0.040;
        if (lockedAct === null) {
            storyLoopProgress = (storyLoopProgress + delta * loopSpeed) % 1.0;
            targetLoopProgress = storyLoopProgress;
            currentAct = storyLoopProgress < 0.30 ? 0 : (storyLoopProgress < 0.72 ? 1 : 2);
        } else {
            storyLoopProgress += (targetLoopProgress - storyLoopProgress) * 0.045;
        }

        // ---------------------------------------------------------------------
        // COMPUTE STORY VARIABLES (Smooth interpolation between acts)
        // ---------------------------------------------------------------------
        let targetDropScale = 1.0;
        let targetWalk = 0.0;
        let targetAwaken = 0.0;

        if (storyLoopProgress < 0.30) {
            // Act 0: Character starts at left end of screen, gathering particles into a glowing drop; heart is DULL
            const t = storyLoopProgress / 0.30;
            targetDropScale = 0.28 + t * 0.77;
            targetWalk = 0.0;
            targetAwaken = 0.0; // Completely dull
        } else if (storyLoopProgress < 0.72) {
            // Act 1: After gathering blooddrop, starts moving from left end across screen to heart at right end
            const t = (storyLoopProgress - 0.30) / 0.42;
            const smoothT = t * t * (3 - 2 * t); // Smooth S-curve easing
            targetDropScale = 1.05;
            targetWalk = smoothT;
            targetAwaken = smoothT * 0.45; // Gentle transition starting to warm up
        } else {
            // Act 2: Arrives at heart; heart awakens from dull to bright, beats with cardiac pulses
            const t = (storyLoopProgress - 0.72) / 0.28;
            targetDropScale = Math.max(0.35, 1.05 - t * 0.58);
            targetWalk = 1.0 - Math.max(0, (t - 0.76) / 0.24) * 0.95;
            targetAwaken = 0.55 + Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5) * 0.45; // Full brightness!
        }

        storyVars.dropletCharge += (targetDropScale - storyVars.dropletCharge) * 0.06;
        const prevWalk = storyVars.mascotWalkProgress;
        storyVars.mascotWalkProgress += (targetWalk - storyVars.mascotWalkProgress) * 0.05;
        const walkVelocity = Math.abs(storyVars.mascotWalkProgress - prevWalk) * 60;
        storyVars.heartAwaken += (targetAwaken - storyVars.heartAwaken) * 0.055;

        // ---------------------------------------------------------------------
        // MASCOT ANIMATION: NATURAL WALKING CADENCE & BIPEDAL KINEMATICS
        // ---------------------------------------------------------------------
        const mascotX = startX + storyVars.mascotWalkProgress * (endX - startX);
        const mascotZ = -0.15 + storyVars.mascotWalkProgress * 0.35;

        // Realistic stride cadence (~4.2 rad/s)
        const strideSpeed = 4.2;
        const stepBlend = Math.min(1.0, walkVelocity * 3.4);
        const stepPhase = elapsed * strideSpeed;

        // Natural vertical stepping bounce (bipedal center-of-mass trajectory)
        const walkStepBob = Math.abs(Math.sin(stepPhase)) * 0.08 * stepBlend;
        const idleBreath = Math.sin(elapsed * 1.8) * 0.025 * (1 - stepBlend * 0.7);

        mascotGroup.position.set(mascotX, -0.32 + walkStepBob + idleBreath, mascotZ);
        mascotShadowDisc.position.set(mascotX, -1.45, mascotZ);
        mascotShadowDisc.scale.setScalar(1.0 - walkStepBob * 0.8);

        // Alternating foot stepping kinematics
        const leftStep = Math.sin(stepPhase) * 0.18 * stepBlend;
        const rightStep = -Math.sin(stepPhase) * 0.18 * stepBlend;
        leftFootMesh.position.set(
            -0.38 + leftStep * 0.2,
            -0.90 + Math.max(0, Math.sin(stepPhase)) * 0.11 * stepBlend,
            0.15 + leftStep
        );
        rightFootMesh.position.set(
            0.38 + rightStep * 0.2,
            -0.90 + Math.max(0, -Math.sin(stepPhase)) * 0.11 * stepBlend,
            0.15 + rightStep
        );

        // Natural lateral body sway as weight transfers between feet
        mascotGroup.rotation.y = 0.32 - storyVars.mascotWalkProgress * 0.10;
        mascotGroup.rotation.z = Math.cos(stepPhase) * 0.045 * stepBlend + Math.sin(elapsed * 1.6) * 0.015;
        mascotGroup.rotation.x = 0.04 * stepBlend;

        // Natural eye blinking & gaze tracking
        const blinkCycle = (elapsed * 0.22) % 1.0;
        const isBlinking = blinkCycle > 0.94;
        leftEyePupil.scale.y = isBlinking ? 0.1 : 1.0;
        rightEyePupil.scale.y = isBlinking ? 0.1 : 1.0;

        const lookX = 0.02 + storyVars.mascotWalkProgress * 0.03 + mouseX * 0.015;
        const lookY = -0.06 + (storyVars.heartAwaken > 0.4 ? 0.02 : -0.01) + mouseY * 0.015;
        leftEyePupil.position.set(-0.24 + lookX, lookY, 0.78);
        rightEyePupil.position.set(0.27 + lookX, lookY, 0.78);

        leftHighlightMajor.position.set(-0.22 + lookX * 0.8, -0.03 + lookY * 0.5, 0.85);
        leftHighlightMinor.position.set(-0.26 + lookX * 0.8, -0.08 + lookY * 0.5, 0.85);
        rightHighlightMajor.position.set(0.29 + lookX * 0.8, -0.03 + lookY * 0.5, 0.85);
        rightHighlightMinor.position.set(0.25 + lookX * 0.8, -0.08 + lookY * 0.5, 0.85);

        // Cradling hands extend gently to offer the droplet as mascot approaches
        const reach = storyVars.mascotWalkProgress * 0.14;
        leftHandMesh.position.set(0.42 + reach, -0.32 + idleBreath * 0.3, 0.58);
        rightHandMesh.position.set(0.70 + reach, -0.32 + idleBreath * 0.3, 0.30);

        // Held Glowing Droplet
        heldDropletGroup.position.set(0.60 + reach, -0.12 + Math.sin(elapsed * 2.8) * 0.02, 0.45);
        heldDropletGroup.scale.setScalar(storyVars.dropletCharge);
        heldDropletMesh.rotation.y = elapsed * 1.1;
        heldDropletMesh.material.emissiveIntensity = 0.65 + storyVars.dropletCharge * 0.4 + Math.sin(elapsed * 3.5) * 0.1;
        heldDropletHalo.material.opacity = 0.3 + storyVars.dropletCharge * 0.35;

        // ---------------------------------------------------------------------
        // GATHERING PARTICLES ANIMATION (Flowing smoothly into mascot's hands)
        // ---------------------------------------------------------------------
        if (scratchVecTarget) {
            scratchVecTarget.set(mascotX + 0.58, -0.40 + walkStepBob + idleBreath, mascotZ + 0.42);
        }
        const gatherIntensity = currentAct === 0 ? 0.95 : (currentAct === 1 ? 0.3 : 0.12);

        gatheringParticles.forEach(p => {
            const u = (elapsed * 0.36 + p.phaseOffset) % 1.0;
            const easeU = u * u * (3 - 2 * u);

            if (scratchVecPos && scratchVecTarget) {
                scratchVecPos.lerpVectors(p.startPos, scratchVecTarget, easeU);
                const arc = Math.sin(easeU * Math.PI) * 0.45;
                scratchVecPos.y += Math.sin(elapsed * p.swirlFreq + p.phaseOffset * 8) * arc * 0.35;
                scratchVecPos.z += Math.cos(elapsed * p.swirlFreq + p.phaseOffset * 6) * arc * 0.25;
                p.mesh.position.copy(scratchVecPos);
            }
            const fade = Math.sin(easeU * Math.PI);
            p.mesh.material.opacity = fade * 0.75 * gatherIntensity;
            p.mesh.scale.setScalar(p.baseScale * (1.1 - easeU * 0.4));
        });

        // ---------------------------------------------------------------------
        // FROM DULL TO BRIGHT WITH AUTHENTIC "LUB-DUB" CARDIAC BEATS
        // -------------------------------------------------------------------------
        const awaken = storyVars.heartAwaken;

        // Human Resting Heartbeat waveform: ~60 BPM (1 cycle = 1.0s)
        const beatCycle = (elapsed * 1.0) % 1.0;
        // Phase 1: "Lub" (Systolic ventricular contraction) at t = 0.12
        const lub = Math.exp(-Math.pow((beatCycle - 0.12) * 16, 2));
        // Phase 2: "Dub" (Aortic/pulmonary valve recoil) at t = 0.32
        const dub = Math.exp(-Math.pow((beatCycle - 0.32) * 18, 2)) * 0.60;
        // Diastolic resting pause follows for the remainder of the cycle (t = 0.40 to 1.0)
        // Cardiac beats activate ONLY as heart turns bright (awaken > 0.25)
        const cardiacImpulse = (lub + dub) * Math.max(0, (awaken - 0.25) / 0.75);

        // Heart movement & scale: Still slow dormant breath when dull; lively pulse when bright
        const idleHeartBreath = Math.sin(elapsed * 1.2) * 0.015 * (1 - awaken * 0.6);
        const heartScale = 1.0 + idleHeartBreath + cardiacImpulse * 0.14;
        bigHeartGroup.scale.setScalar(heartScale);
        bigHeartGroup.position.y = -0.10 + Math.sin(elapsed * 1.4) * 0.02;
        bigHeartGroup.rotation.y = -0.18 + Math.sin(elapsed * 0.75) * 0.04;

        // COLOR & LUMINESCENCE: FROM DULL TO BRIGHT
        // Dull state: Muted dark rose-wine (0x6E2424) with NO emissive
        // Bright state: Vibrant warm living red (0xD42B1E) with warm glowing emissive
        if (dullHeartColor && brightHeartColor) {
            bigHeartMesh.material.color.copy(dullHeartColor).lerp(brightHeartColor, awaken);
        }
        if (brightHeartEmissive) {
            bigHeartMesh.material.emissive.copy(brightHeartEmissive);
        }
        bigHeartMesh.material.emissiveIntensity = awaken * 0.42 + cardiacImpulse * 0.48;

        // Inner Luminescent Core (Appears as it brightens)
        bigHeartInnerCore.material.opacity = awaken * 0.32 + cardiacImpulse * 0.22;
        bigHeartInnerCore.scale.setScalar(0.88 + cardiacImpulse * 0.12);

        // Soft Radial Aura (Glows when bright & pulses with beats)
        bigHeartAura.material.opacity = awaken * 0.22 + cardiacImpulse * 0.16;
        const auraSize = 3.2 + awaken * 0.8 + cardiacImpulse * 0.4;
        bigHeartAura.scale.set(auraSize, auraSize, 1);

        // Expanding Crimson Pulse Ring (Triggered during cardiac beat)
        heartPulseWaves.forEach(w => {
            const cycle = (elapsed * 0.5 + w.offset) % 1.0;
            const s = 1.0 + cycle * 1.5;
            w.mesh.scale.set(s, s, 1);
            w.mesh.material.opacity = (1.0 - cycle) * 0.25 * Math.max(0, (awaken - 0.3) / 0.7);
        });

        // Radiating warm sparks drifting outward from the beating heart
        radiatingParticles.forEach(rp => {
            const cycle = (elapsed * 0.4 + rp.phaseOffset) % 1.0;
            const dist = 0.65 + cycle * 2.1;
            rp.mesh.position.copy(rp.dir).multiplyScalar(dist);
            const fade = Math.sin(cycle * Math.PI);
            rp.mesh.material.opacity = fade * 0.65 * Math.max(0, (awaken - 0.35) / 0.65);
            rp.mesh.scale.setScalar(rp.baseScale * (1.0 - cycle * 0.35));
        });

        // Subtle 3D camera parallax following user mouse
        camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.04;
        camera.position.y += (0.28 + mouseY * 0.18 - camera.position.y) * 0.04;
        camera.lookAt(0, 0.05, 0);

        renderer.render(scene, camera);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
