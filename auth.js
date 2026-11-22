/**
 * EasyConnect — Authentication & Interactive Mascot Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // Mascot elements
    const mascotStage = document.getElementById("mascotStage");
    const leftPupil = document.getElementById("leftPupil");
    const rightPupil = document.getElementById("rightPupil");

    // Tab switcher elements
    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const tabTabBar = document.querySelector(".auth-tab-bar");
    const panelLogin = document.getElementById("panelLogin");
    const panelSignup = document.getElementById("panelSignup");
    const panelForgot = document.getElementById("panelForgot");

    const headerToggleBtn = document.getElementById("headerToggleBtn");
    const headerToggleHint = document.getElementById("headerToggleHint");

    // Inputs — Log In
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const toggleLoginPassword = document.getElementById("toggleLoginPassword");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");

    // Inputs — Forgot Password
    const formForgot = document.getElementById("formForgot");
    const forgotEmail = document.getElementById("forgotEmail");
    const forgotEmailError = document.getElementById("forgotEmailError");
    const forgotFeedbackPanel = document.getElementById("forgotFeedbackPanel");
    const forgotTargetEmail = document.getElementById("forgotTargetEmail");
    const backToLoginFromForgot = document.getElementById("backToLoginFromForgot");
    const returnToLoginBtn = document.getElementById("returnToLoginBtn");

    // Inputs — Sign Up (Only Name, Email, Password, Confirm Password, OTP)
    const signupName = document.getElementById("signupName");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const toggleSignupPassword = document.getElementById("toggleSignupPassword");
    const signupConfirmPassword = document.getElementById("signupConfirmPassword");
    const toggleSignupConfirmPassword = document.getElementById("toggleSignupConfirmPassword");
    const signupOtp = document.getElementById("signupOtp");
    const btnSendOtp = document.getElementById("btnSendOtp");
    const otpHintMsg = document.getElementById("otpHintMsg");

    const formLogin = document.getElementById("formLogin");
    const formSignup = document.getElementById("formSignup");

    let generatedOtp = null;
    let otpCountdownInterval = null;

    /* =========================================================
       1. SEGMENTED TAB SWITCHER (LOG IN / SIGN UP / FORGOT)
       ========================================================= */
    const switchTab = (mode) => {
        if (mode === "forgot") {
            tabTabBar?.classList.remove("signup-active");
            tabLogin?.classList.remove("active");
            tabSignup?.classList.remove("active");
            tabLogin?.setAttribute("aria-selected", "false");
            tabSignup?.setAttribute("aria-selected", "false");

            panelLogin?.classList.remove("active");
            panelSignup?.classList.remove("active");
            panelForgot?.classList.add("active");

            // Reset forgot form state
            if (formForgot) formForgot.style.display = "block";
            if (forgotFeedbackPanel) forgotFeedbackPanel.style.display = "none";
            if (forgotEmail) {
                forgotEmail.value = "";
                document.getElementById("fieldForgotEmail")?.classList.remove("has-error");
                if (forgotEmailError) forgotEmailError.textContent = "";
                setTimeout(() => forgotEmail.focus(), 80);
            }

            if (headerToggleHint) headerToggleHint.textContent = "Remembered password?";
            if (headerToggleBtn) headerToggleBtn.textContent = "Log In";
        } else if (mode === "signup") {
            tabTabBar?.classList.add("signup-active");
            tabLogin?.classList.remove("active");
            tabSignup?.classList.add("active");
            tabLogin?.setAttribute("aria-selected", "false");
            tabSignup?.setAttribute("aria-selected", "true");

            panelLogin?.classList.remove("active");
            panelForgot?.classList.remove("active");
            panelSignup?.classList.add("active");

            if (headerToggleHint) headerToggleHint.textContent = "Already have an account?";
            if (headerToggleBtn) headerToggleBtn.textContent = "Log In";

            if (typeof updateSignupStepUI === "function") {
                updateSignupStepUI();
            }
        } else {
            tabTabBar?.classList.remove("signup-active");
            tabLogin?.classList.add("active");
            tabSignup?.classList.remove("active");
            tabLogin?.setAttribute("aria-selected", "true");
            tabSignup?.setAttribute("aria-selected", "false");

            panelForgot?.classList.remove("active");
            panelSignup?.classList.remove("active");
            panelLogin?.classList.add("active");

            if (headerToggleHint) headerToggleHint.textContent = "Don't have an account?";
            if (headerToggleBtn) headerToggleBtn.textContent = "Sign Up";
        }

        // Reset mascot states on tab switch
        mascotStage?.classList.remove("covering-eyes", "peeking");
        resetPupils();
    };

    tabLogin?.addEventListener("click", () => switchTab("login"));
    tabSignup?.addEventListener("click", () => switchTab("signup"));

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("forgot");
        });
    }

    if (backToLoginFromForgot) {
        backToLoginFromForgot.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("login");
        });
    }

    if (returnToLoginBtn) {
        returnToLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            switchTab("login");
        });
    }

    if (headerToggleBtn) {
        headerToggleBtn.addEventListener("click", () => {
            const isLoginActive = tabLogin?.classList.contains("active");
            switchTab(isLoginActive ? "signup" : "login");
        });
    }

    // Direct URL parameter & hash routing (e.g. login.html?tab=signup or #signup or #forgot)
    const initAuthTabFromURL = () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tabParam = (params.get("tab") || window.location.hash.replace("#", "")).toLowerCase();
            if (tabParam === "signup" || tabParam === "register") {
                switchTab("signup");
            } else if (tabParam === "forgot" || tabParam === "reset") {
                switchTab("forgot");
            } else if (tabParam === "login" || tabParam === "signin") {
                switchTab("login");
            }
        } catch (err) {
            console.warn("Could not read auth tab parameter", err);
        }
    };
    initAuthTabFromURL();
    window.addEventListener("hashchange", initAuthTabFromURL);

    /* =========================================================
       2. MASCOT EYE-TRACKING (HORIZONTALLY TRACKS CURSOR IN TEXT)
       ========================================================= */
    const resetPupils = () => {
        if (leftPupil) leftPupil.setAttribute("transform", "translate(0, 0)");
        if (rightPupil) rightPupil.setAttribute("transform", "translate(0, 0)");
    };

    const trackCursor = (input) => {
        if (!input || mascotStage?.classList.contains("covering-eyes")) return;
        const val = input.value || "";
        const maxLen = Math.max(val.length, 18);
        const selPos = input.selectionStart ?? val.length;

        // Ratio from -0.5 (far left) to +0.5 (far right)
        const ratio = (selPos / maxLen) - 0.5;
        const offsetX = Math.min(5.5, Math.max(-5.5, ratio * 10));
        const offsetY = 2.2; // looking down at the form inputs

        if (leftPupil) leftPupil.setAttribute("transform", `translate(${offsetX.toFixed(1)}, ${offsetY})`);
        if (rightPupil) rightPupil.setAttribute("transform", `translate(${offsetX.toFixed(1)}, ${offsetY})`);
    };

    // Attach tracking to non-password inputs
    [loginEmail, signupName, signupEmail, signupOtp].forEach((input) => {
        if (!input) return;
        input.addEventListener("focus", () => trackCursor(input));
        input.addEventListener("input", () => trackCursor(input));
        input.addEventListener("keyup", () => trackCursor(input));
        input.addEventListener("click", () => trackCursor(input));
        input.addEventListener("blur", () => {
            setTimeout(() => {
                const active = document.activeElement;
                if (![loginEmail, signupName, signupEmail, signupOtp, loginPassword, signupPassword, signupConfirmPassword].includes(active)) {
                    resetPupils();
                }
            }, 100);
        });
    });

    /* =========================================================
       3. MASCOT PRIVACY COVERING EYES ON PASSWORD FOCUS
       ========================================================= */
    const setupPasswordMascot = (passwordInput, toggleBtn) => {
        if (!passwordInput) return;

        const handlePasswordFocus = () => {
            const isText = passwordInput.getAttribute("type") === "text";
            mascotStage?.classList.add("covering-eyes");
            if (isText) {
                mascotStage?.classList.add("peeking");
            } else {
                mascotStage?.classList.remove("peeking");
            }
        };

        passwordInput.addEventListener("focus", handlePasswordFocus);
        passwordInput.addEventListener("input", handlePasswordFocus);
        passwordInput.addEventListener("click", handlePasswordFocus);

        passwordInput.addEventListener("blur", () => {
            setTimeout(() => {
                const active = document.activeElement;
                const allPasswordInputs = [loginPassword, signupPassword, signupConfirmPassword];
                const allToggleBtns = [toggleLoginPassword, toggleSignupPassword, toggleSignupConfirmPassword];

                // If focus moved to another password field or an eye toggle, stay covered!
                if (allPasswordInputs.includes(active) || allToggleBtns.includes(active) || allToggleBtns.some(b => b?.contains(active))) {
                    return;
                }

                mascotStage?.classList.remove("covering-eyes", "peeking");
                resetPupils();
            }, 120);
        });

        if (toggleBtn) {
            toggleBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const isPassword = passwordInput.getAttribute("type") === "password";
                const newType = isPassword ? "text" : "password";
                passwordInput.setAttribute("type", newType);

                // Update eye icon
                const icon = toggleBtn.querySelector("i");
                if (icon) {
                    icon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
                }

                // Keep focus on the password input
                passwordInput.focus();

                // Mascot peeking state
                mascotStage?.classList.add("covering-eyes");
                if (isPassword) {
                    // Password revealed -> peek through one hand!
                    mascotStage?.classList.add("peeking");
                } else {
                    // Password hidden -> cover both eyes tightly
                    mascotStage?.classList.remove("peeking");
                }
            });
        }
    };

    setupPasswordMascot(loginPassword, toggleLoginPassword);
    setupPasswordMascot(signupPassword, toggleSignupPassword);
    setupPasswordMascot(signupConfirmPassword, toggleSignupConfirmPassword);

    /* =========================================================
       4. SIGN UP MULTI-STEP WIZARD LOGIC
       ========================================================= */
    const signupSteps = document.querySelectorAll(".signup-step");
    const signupStepText = document.getElementById("signupStepText");
    const signupStepPercent = document.getElementById("signupStepPercent");
    const signupProgressFill = document.getElementById("signupProgressFill");
    const signupStepHeader = document.getElementById("signupStepHeader");
    const signupStepSubtext = document.getElementById("signupStepSubtext");
    const signupBackBtn = document.getElementById("signupBackBtn");
    const signupNextBtn = document.getElementById("signupNextBtn");

    let currentSignupStep = 0;

    const stepData = [
        {
            title: "Step 1 of 3 · Your Details",
            percent: "0%",
            header: "Create your account",
            subtext: "An account lets you request blood or manage alerts. You can set up a donor profile after signing up.",
            btnText: 'Continue <i class="fa-solid fa-arrow-right"></i>'
        },
        {
            title: "Step 2 of 3 · Security",
            percent: "50%",
            header: "Set Your Password",
            subtext: "Create a secure password to protect your account",
            btnText: 'Continue <i class="fa-solid fa-arrow-right"></i>'
        },
        {
            title: "Step 3 of 3 · Verification",
            percent: "75%",
            header: "Verify Your Email",
            subtext: "Confirm your account with the 6-digit OTP code",
            btnText: 'Verify & Create Account <i class="fa-solid fa-arrow-right"></i>'
        }
    ];

    const updateSignupStepUI = () => {
        signupSteps.forEach((step, idx) => {
            if (idx === currentSignupStep) {
                step.classList.add("active");
            } else {
                step.classList.remove("active");
            }
        });

        const currentData = stepData[currentSignupStep];
        if (signupStepText) signupStepText.textContent = currentData.title;
        if (signupStepPercent) signupStepPercent.textContent = currentData.percent;
        if (signupProgressFill) signupProgressFill.style.width = currentData.percent;
        if (signupStepHeader) signupStepHeader.textContent = currentData.header;
        if (signupStepSubtext) signupStepSubtext.textContent = currentData.subtext;
        if (signupNextBtn) {
            signupNextBtn.innerHTML = `<span>${currentData.btnText}</span>`;
            signupNextBtn.disabled = false;
        }

        if (signupBackBtn) {
            signupBackBtn.style.display = currentSignupStep > 0 ? "inline-flex" : "none";
        }

        // Reset mascot eye covering if moving away from password step
        if (currentSignupStep !== 1) {
            mascotStage?.classList.remove("covering-eyes", "peeking");
            resetPupils();
        }
    };

    const validateSignupStep = (stepIdx) => {
        let isValid = true;
        let firstInvalidField = null;

        if (stepIdx === 0) {
            const nameVal = (signupName?.value || "").trim();
            const emailVal = (signupEmail?.value || "").trim();
            const fieldName = document.getElementById("fieldSignupName");
            const fieldEmail = document.getElementById("fieldSignupEmail");
            const errName = document.getElementById("signupNameError");
            const errEmail = document.getElementById("signupEmailError");

            if (nameVal.length < 2) {
                fieldName?.classList.add("has-error");
                if (errName) errName.textContent = "Please enter your full name.";
                isValid = false;
                if (!firstInvalidField) firstInvalidField = signupName;
            } else {
                fieldName?.classList.remove("has-error");
            }

            if (!emailVal || !emailVal.includes("@") || !emailVal.includes(".")) {
                fieldEmail?.classList.add("has-error");
                if (errEmail) errEmail.textContent = "Please enter a valid email address.";
                isValid = false;
                if (!firstInvalidField) firstInvalidField = signupEmail;
            } else {
                fieldEmail?.classList.remove("has-error");
            }
        } else if (stepIdx === 1) {
            const passVal = (signupPassword?.value || "").trim();
            const confirmVal = (signupConfirmPassword?.value || "").trim();
            const fieldPass = document.getElementById("fieldSignupPassword");
            const fieldConfirm = document.getElementById("fieldSignupConfirmPassword");
            const errPass = document.getElementById("signupPasswordError");
            const errConfirm = document.getElementById("signupConfirmPasswordError");

            if (passVal.length < 8) {
                fieldPass?.classList.add("has-error");
                if (errPass) errPass.textContent = "Password must be at least 8 characters.";
                isValid = false;
                if (!firstInvalidField) firstInvalidField = signupPassword;
            } else {
                fieldPass?.classList.remove("has-error");
            }

            if (confirmVal.length === 0) {
                fieldConfirm?.classList.add("has-error");
                if (errConfirm) errConfirm.textContent = "Please confirm your password.";
                isValid = false;
                if (!firstInvalidField) firstInvalidField = signupConfirmPassword;
            } else if (confirmVal !== passVal) {
                fieldConfirm?.classList.add("has-error");
                if (errConfirm) errConfirm.textContent = "Passwords do not match.";
                isValid = false;
                if (!firstInvalidField) firstInvalidField = signupConfirmPassword;
            } else {
                fieldConfirm?.classList.remove("has-error");
            }
        } else if (stepIdx === 2) {
            const otpVal = (signupOtp?.value || "").trim();
            const fieldOtp = document.getElementById("fieldSignupOtp");
            const errOtp = document.getElementById("signupOtpError");

            if (otpVal.length < 6) {
                fieldOtp?.classList.add("has-error");
                if (errOtp) errOtp.textContent = "Please enter the 6-digit OTP code (Click 'Send OTP').";
                isValid = false;
                if (!firstInvalidField) firstInvalidField = signupOtp;
            } else {
                fieldOtp?.classList.remove("has-error");
            }
        }

        if (!isValid && firstInvalidField) {
            firstInvalidField.focus();
        }

        return isValid;
    };

    if (signupNextBtn) {
        signupNextBtn.addEventListener("click", () => {
            if (!validateSignupStep(currentSignupStep)) return;

            if (currentSignupStep < 2) {
                currentSignupStep++;
                updateSignupStepUI();
                if (currentSignupStep === 1) {
                    signupPassword?.focus();
                } else if (currentSignupStep === 2) {
                    signupOtp?.focus();
                }
            } else {
                // Final submission
                signupNextBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying & Creating Account...`;
                signupNextBtn.disabled = true;

                // Save user info for profile prefill
                try {
                    const finalName = (signupName?.value || "").trim() || "Aditi Sharma";
                    const finalEmail = (signupEmail?.value || "").trim() || "aditi@example.com";
                    localStorage.setItem("easyconnect_user", JSON.stringify({ name: finalName, email: finalEmail }));
                } catch (e) {
                    console.warn("Storage not available", e);
                }

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 900);
            }
        });
    }

    if (signupBackBtn) {
        signupBackBtn.addEventListener("click", () => {
            if (currentSignupStep > 0) {
                currentSignupStep--;
                updateSignupStepUI();
            }
        });
    }

    /* =========================================================
       5. EMAIL OTP GENERATION & TIMER (SIGN UP)
       ========================================================= */
    if (btnSendOtp && signupEmail) {
        btnSendOtp.addEventListener("click", () => {
            const emailVal = (signupEmail.value || "").trim();
            const fieldEmail = document.getElementById("fieldSignupEmail");
            const errEmail = document.getElementById("signupEmailError");

            if (!emailVal || !emailVal.includes("@") || !emailVal.includes(".")) {
                if (currentSignupStep !== 0) {
                    currentSignupStep = 0;
                    updateSignupStepUI();
                }
                fieldEmail?.classList.add("has-error");
                if (errEmail) errEmail.textContent = "Please enter your valid email first to receive OTP.";
                signupEmail.focus();
                return;
            } else {
                fieldEmail?.classList.remove("has-error");
            }

            // Generate 6-digit mock OTP
            generatedOtp = "842109";

            if (otpHintMsg) {
                otpHintMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Code sent! <strong>Demo OTP: 842109</strong>`;
                otpHintMsg.style.color = "var(--sage)";
            }

            // Auto-focus OTP input
            if (signupOtp) {
                signupOtp.focus();
                trackCursor(signupOtp);
            }

            // Start 30s countdown
            let countdown = 30;
            btnSendOtp.disabled = true;
            btnSendOtp.innerHTML = `<span>Resend (${countdown}s)</span>`;

            if (otpCountdownInterval) clearInterval(otpCountdownInterval);

            otpCountdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    btnSendOtp.innerHTML = `<span>Resend (${countdown}s)</span>`;
                } else {
                    clearInterval(otpCountdownInterval);
                    btnSendOtp.disabled = false;
                    btnSendOtp.innerHTML = `<span>Resend OTP</span>`;
                }
            }, 1000);
        });
    }

    /* =========================================================
       6. FORM SUBMISSIONS & VALIDATION
       ========================================================= */
    if (formLogin) {
        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();
            let hasError = false;
            let firstInvalid = null;

            const emailVal = (loginEmail?.value || "").trim();
            const passVal = (loginPassword?.value || "").trim();

            const fieldEmail = document.getElementById("fieldLoginEmail");
            const fieldPass = document.getElementById("fieldLoginPassword");
            const errEmail = document.getElementById("loginEmailError");
            const errPass = document.getElementById("loginPasswordError");

            if (!emailVal || !emailVal.includes("@")) {
                fieldEmail?.classList.add("has-error");
                if (errEmail) errEmail.textContent = "Please enter a valid email address.";
                hasError = true;
                if (!firstInvalid) firstInvalid = loginEmail;
            } else {
                fieldEmail?.classList.remove("has-error");
            }

            if (!passVal || passVal.length < 6) {
                fieldPass?.classList.add("has-error");
                if (errPass) errPass.textContent = "Please enter your password (minimum 6 characters).";
                hasError = true;
                if (!firstInvalid) firstInvalid = loginPassword;
            } else {
                fieldPass?.classList.remove("has-error");
            }

            if (hasError && firstInvalid) {
                firstInvalid.focus();
                return;
            }

            if (!hasError) {
                const btn = document.getElementById("loginSubmitBtn");
                btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Logging in...`;
                btn.disabled = true;

                // Save session in localStorage
                try {
                    localStorage.setItem("easyconnect_user", JSON.stringify({ name: "Logged In User", email: emailVal }));
                } catch (e) {
                    console.warn("Storage not available", e);
                }

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 900);
            }
        });
    }

    /* FORGOT PASSWORD FORM SUBMISSION */
    if (formForgot) {
        formForgot.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailVal = (forgotEmail?.value || "").trim();
            const fieldForgot = document.getElementById("fieldForgotEmail");

            if (!emailVal || !emailVal.includes("@") || !emailVal.includes(".")) {
                fieldForgot?.classList.add("has-error");
                if (forgotEmailError) forgotEmailError.textContent = "Please enter a valid registered email address.";
                forgotEmail?.focus();
                return;
            }

            fieldForgot?.classList.remove("has-error");
            if (forgotEmailError) forgotEmailError.textContent = "";

            const btn = document.getElementById("btnForgotSubmit");
            if (btn) {
                btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Checking account...`;
                btn.disabled = true;
            }

            setTimeout(() => {
                if (formForgot) formForgot.style.display = "none";
                if (forgotFeedbackPanel) forgotFeedbackPanel.style.display = "block";
                if (forgotTargetEmail) forgotTargetEmail.textContent = emailVal;
                if (btn) {
                    btn.innerHTML = `Send Reset Instructions <i class="fa-solid fa-arrow-right"></i>`;
                    btn.disabled = false;
                }
            }, 600);
        });
    }

    if (formSignup) {
        formSignup.addEventListener("submit", (e) => {
            e.preventDefault();
            signupNextBtn?.click();
        });
    }
});
