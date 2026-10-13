import type { Dispatch, SetStateAction } from "react";
import type { Personality, Screen } from "../../app/types";
import { interests, questions } from "../../data/kinliiData";
import { KinliiSymbol, Logo } from "../../components/ui/Branding";
import { Icon } from "../../components/ui/Icon";
import { Progress } from "../../components/ui/Progress";

type SetScreen = Dispatch<SetStateAction<Screen>>;

export function WelcomeScreen({ setScreen }: { setScreen: SetScreen }) {
  return (
    <div className="phone-shell onboarding welcome-screen">
      <header className="simple-header">
        <Logo />
        <button onClick={() => setScreen("login")}>Sign in</button>
      </header>
      <div className="hero-visual">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="person-bubble person-a">
          <Icon name="racquet" size={22} />
        </div>
        <div className="person-bubble person-b">
          <Icon name="trail" size={22} />
        </div>
        <div className="person-bubble person-c">
          <Icon name="dance" size={22} />
        </div>
        <div className="center-mark">
          <KinliiSymbol />
        </div>
        <span className="interest-chip chip-one">Badminton</span>
        <span className="interest-chip chip-two">Hiking</span>
        <span className="interest-chip chip-three">Film</span>
      </div>
      <div className="welcome-copy">
        <span className="kicker">LESS SCREEN. MORE SEEN.</span>
        <h1>
          Meet people who just <em>get you.</em>
        </h1>
        <p>
          Kin connects you with small, verified groups nearby based on your interests and
          personality.
        </p>
      </div>
      <div className="bottom-action">
        <button className="primary-button" onClick={() => setScreen("verify")}>
          Find my people <Icon name="chevron" />
        </button>
        <p>Made for students · Safe by design</p>
      </div>
    </div>
  );
}

type LoginScreenProps = {
  email: string;
  error: string;
  loading: boolean;
  onSignIn: () => Promise<void>;
  password: string;
  setEmail: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
  setScreen: SetScreen;
};

export function LoginScreen(props: LoginScreenProps) {
  const { email, error, loading, onSignIn, password, setEmail, setPassword, setScreen } = props;
  const validEmail = /^[^\s@]+@[^\s@]+\.edu$/i.test(email);

  return (
    <div className="phone-shell onboarding verify-screen">
      <header className="flow-header">
        <button onClick={() => setScreen("welcome")}>
          <Icon name="arrow" />
        </button>
        <Logo />
        <span>Sign in</span>
      </header>
      <main className="verification-content login-content">
        <div className="verification-mark profile-mark">
          <Icon name="user" size={31} />
        </div>
        <span className="step-label">WELCOME BACK</span>
        <h1>Sign in to Kinlii</h1>
        <p>Use the password you created after verifying your student email.</p>

        <label className="edu-input">
          <span>University email</span>
          <div>
            <Icon name="user" size={18} />
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@university.edu"
            />
          </div>
        </label>
        <label className="edu-input">
          <span>Password</span>
          <div>
            <Icon name="check" size={18} />
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </div>
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="email-login-alternative" onClick={() => setScreen("verify")}>
          Haven’t created a password yet? Use email verification
        </button>
      </main>
      <div className="bottom-action">
        <button
          className="primary-button"
          disabled={loading || !validEmail || password.length < 8}
          onClick={() => void onSignIn()}
        >
          {loading ? "Signing in…" : "Sign in"} {!loading && <Icon name="chevron" />}
        </button>
        <p>New to Kinlii? Verify your student email first.</p>
      </div>
    </div>
  );
}

type PasswordSetupScreenProps = {
  confirmPassword: string;
  error: string;
  loading: boolean;
  onSave: () => Promise<void>;
  password: string;
  setConfirmPassword: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
};

export function PasswordSetupScreen(props: PasswordSetupScreenProps) {
  const { confirmPassword, error, loading, onSave, password, setConfirmPassword, setPassword } =
    props;
  const longEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  return (
    <div className="phone-shell onboarding verify-screen">
      <header className="flow-header">
        <span className="flow-header-spacer" />
        <Progress step={2} total={5} />
        <span>Security</span>
      </header>
      <main className="verification-content password-setup-content">
        <div className="verification-mark profile-mark">
          <Icon name="check" size={31} />
        </div>
        <span className="step-label">EMAIL VERIFIED</span>
        <h1>Create your password</h1>
        <p>Next time, sign in instantly without waiting for another verification email.</p>

        <label className="edu-input">
          <span>Password</span>
          <div>
            <Icon name="check" size={18} />
            <input
              autoComplete="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
        </label>
        <label className="edu-input">
          <span>Confirm password</span>
          <div>
            <Icon name="check" size={18} />
            <input
              autoComplete="new-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter it again"
            />
          </div>
        </label>

        <div className="password-requirements">
          <span className={longEnough ? "met" : ""}>
            <Icon name="check" size={13} /> At least 8 characters
          </span>
          <span className={confirmPassword && passwordsMatch ? "met" : ""}>
            <Icon name="check" size={13} /> Passwords match
          </span>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
      </main>
      <div className="bottom-action">
        <button
          className="primary-button"
          disabled={loading || !longEnough || !passwordsMatch}
          onClick={() => void onSave()}
        >
          {loading ? "Securing account…" : "Save password"} {!loading && <Icon name="chevron" />}
        </button>
        <p>Supabase securely hashes your password. Kinlii never stores or displays it.</p>
      </div>
    </div>
  );
}

type VerificationScreenProps = {
  authError: string;
  authLoading: boolean;
  codeSent: boolean;
  onSendCode: () => Promise<void>;
  onVerifyCode: () => Promise<void>;
  schoolEmail: string;
  setCodeSent: Dispatch<SetStateAction<boolean>>;
  setSchoolEmail: Dispatch<SetStateAction<string>>;
  setScreen: SetScreen;
  setVerificationCode: Dispatch<SetStateAction<string>>;
  verificationCode: string;
};

export function VerificationScreen(props: VerificationScreenProps) {
  const {
    authError,
    authLoading,
    codeSent,
    onSendCode,
    onVerifyCode,
    schoolEmail,
    setCodeSent,
    setSchoolEmail,
    setScreen,
    setVerificationCode,
    verificationCode,
  } = props;
  const validEmail = /^[^\s@]+@[^\s@]+\.edu$/i.test(schoolEmail);
  return (
    <div className="phone-shell onboarding verify-screen">
      <header className="flow-header">
        <button onClick={() => (codeSent ? setCodeSent(false) : setScreen("welcome"))}>
          <Icon name="arrow" />
        </button>
        <Progress step={1} total={4} />
        <span>Verify</span>
      </header>
      <main className="verification-content">
        <div className="verification-mark">
          <Icon name="check" size={31} />
          <span className="school-dot one" />
          <span className="school-dot two" />
        </div>
        <span className="step-label">STUDENTS ONLY</span>
        <h1>{codeSent ? "Check your inbox" : "Verify your student status"}</h1>
        <p>
          {codeSent
            ? `We sent a secure sign-in email to ${schoolEmail}.`
            : "Kin is a trusted student community. Use your university email to keep every group verified and accountable."}
        </p>
        {!codeSent ? (
          <>
            <label className="edu-input">
              <span>University email</span>
              <div>
                <Icon name="user" size={18} />
                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(event) => setSchoolEmail(event.target.value)}
                  placeholder="name@university.edu"
                />
              </div>
            </label>
            {schoolEmail && !validEmail && (
              <p className="field-error">Please enter a valid email ending in .edu</p>
            )}
            <section className="verification-benefits">
              <div>
                <span>
                  <Icon name="check" size={14} />
                </span>
                <p>
                  <strong>Verified community</strong>
                  <small>Only active students can join or host.</small>
                </p>
              </div>
              <div>
                <span>
                  <Icon name="check" size={14} />
                </span>
                <p>
                  <strong>Your email stays private</strong>
                  <small>Other members only see your first name and school.</small>
                </p>
              </div>
              <div>
                <span>
                  <Icon name="check" size={14} />
                </span>
                <p>
                  <strong>Safer meetups</strong>
                  <small>Every account is tied to a university identity.</small>
                </p>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="magic-link-instructions">
              <span>
                <Icon name="check" size={16} />
              </span>
              <div>
                <strong>Open the email and select “Sign in”</strong>
                <p>You’ll return to Kinlii and continue automatically.</p>
              </div>
            </section>
            <div className="verification-divider">
              <span>or use a code if your email includes one</span>
            </div>
            <label className="edu-input code-input">
              <span>Six-digit code</span>
              <div>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </div>
            </label>
          </>
        )}
        {authError && (
          <p className="auth-error" role="alert">
            {authError}
          </p>
        )}
      </main>
      <div className="bottom-action">
        <button
          className="primary-button"
          disabled={authLoading || (codeSent ? verificationCode.length !== 6 : !validEmail)}
          onClick={() => void (codeSent ? onVerifyCode() : onSendCode())}
        >
          {authLoading ? "Please wait…" : codeSent ? "Verify and continue" : "Send sign-in email"}{" "}
          {!authLoading && <Icon name="chevron" />}
        </button>
        <p>
          {codeSent
            ? "Didn't receive it? Go back and send a new email."
            : "By continuing, you agree to our community guidelines."}
        </p>
      </div>
    </div>
  );
}

type ProfileSetupScreenProps = {
  bio: string;
  displayName: string;
  error: string;
  loading: boolean;
  onContinue: () => Promise<void>;
  setBio: Dispatch<SetStateAction<string>>;
  setDisplayName: Dispatch<SetStateAction<string>>;
  setUniversityName: Dispatch<SetStateAction<string>>;
  universityName: string;
};

export function ProfileSetupScreen(props: ProfileSetupScreenProps) {
  const {
    bio,
    displayName,
    error,
    loading,
    onContinue,
    setBio,
    setDisplayName,
    setUniversityName,
    universityName,
  } = props;
  const formComplete = displayName.trim().length >= 2 && universityName.trim().length >= 2;

  return (
    <div className="phone-shell onboarding verify-screen">
      <header className="flow-header">
        <span className="flow-header-spacer" />
        <Progress step={2} total={5} />
        <span>Profile</span>
      </header>
      <main className="verification-content profile-setup-content">
        <div className="verification-mark profile-mark">
          <Icon name="user" size={31} />
        </div>
        <span className="step-label">WELCOME TO KINLII</span>
        <h1>Create your profile</h1>
        <p>Tell your future groups who they’ll be meeting. You can update these details later.</p>

        <label className="edu-input">
          <span>Your name</span>
          <div>
            <Icon name="user" size={18} />
            <input
              autoComplete="name"
              maxLength={60}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Aayushman"
            />
          </div>
        </label>

        <label className="edu-input">
          <span>University</span>
          <div>
            <Icon name="location" size={18} />
            <input
              maxLength={100}
              value={universityName}
              onChange={(event) => setUniversityName(event.target.value)}
              placeholder="Arizona State University"
            />
          </div>
        </label>

        <label className="profile-bio-input">
          <span>
            Short bio <small>Optional</small>
          </span>
          <textarea
            maxLength={180}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What do you enjoy doing with new people?"
          />
          <small>{bio.length}/180</small>
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
      </main>
      <div className="bottom-action">
        <button
          className="primary-button"
          disabled={loading || !formComplete}
          onClick={() => void onContinue()}
        >
          {loading ? "Saving…" : "Continue"} {!loading && <Icon name="chevron" />}
        </button>
        <p>Your email is verified. Your profile details remain editable.</p>
      </div>
    </div>
  );
}

type InterestSelectionScreenProps = {
  chooseInterest: (name: string) => void;
  selectedInterests: string[];
  setScreen: SetScreen;
};

export function InterestSelectionScreen(props: InterestSelectionScreenProps) {
  const { chooseInterest, selectedInterests, setScreen } = props;
  return (
    <div className="phone-shell onboarding">
      <header className="flow-header">
        <button onClick={() => setScreen("welcome")}>
          <Icon name="arrow" />
        </button>
        <Progress step={1} total={3} />
        <span>1 of 3</span>
      </header>
      <main className="flow-content">
        <span className="step-label">LET’S START WITH YOU</span>
        <h1>What are you into?</h1>
        <p>
          Pick at least 3. We’ll use these to find activities and people you’ll genuinely enjoy.
        </p>
        <div className="interest-grid">
          {interests.map(([name, description, symbol]) => (
            <button
              key={name}
              className={selectedInterests.includes(name) ? "selected" : ""}
              onClick={() => chooseInterest(name)}
            >
              <span className={`interest-symbol ${symbol}`}>
                <Icon
                  name={
                    name === "Sports"
                      ? "star"
                      : name === "Outdoors"
                        ? "compass"
                        : name === "Books"
                          ? "calendar"
                          : name === "Food"
                            ? "heart"
                            : "sparkles"
                  }
                  size={21}
                />
              </span>
              <strong>{name}</strong>
              <small>{description}</small>
              <span className="selection-check">
                <Icon name="check" size={13} />
              </span>
            </button>
          ))}
        </div>
      </main>
      <div className="bottom-action sticky">
        <div className="selection-count">
          <strong>{selectedInterests.length}</strong> selected{" "}
          <span>
            {selectedInterests.length < 3
              ? `Pick ${3 - selectedInterests.length} more`
              : "Looks good"}
          </span>
        </div>
        <button
          className="primary-button"
          disabled={selectedInterests.length < 3}
          onClick={() => setScreen("quiz")}
        >
          Continue <Icon name="chevron" />
        </button>
      </div>
    </div>
  );
}

type PersonalityQuizScreenProps = {
  answers: number[];
  chooseAnswer: (index: number) => void;
  finishQuestion: () => void;
  quizStep: number;
  setQuizStep: Dispatch<SetStateAction<number>>;
  setScreen: SetScreen;
};

export function PersonalityQuizScreen(props: PersonalityQuizScreenProps) {
  const { answers, chooseAnswer, finishQuestion, quizStep, setQuizStep, setScreen } = props;
  const question = questions[quizStep];
  return (
    <div className="phone-shell onboarding">
      <header className="flow-header">
        <button onClick={() => (quizStep ? setQuizStep(quizStep - 1) : setScreen("interests"))}>
          <Icon name="arrow" />
        </button>
        <Progress step={quizStep + 1} total={questions.length} />
        <span>
          {quizStep + 1} of {questions.length}
        </span>
      </header>
      <main className="flow-content quiz-content">
        <span className="step-label">
          <Icon name="sparkles" size={14} /> YOUR SOCIAL STYLE
        </span>
        <h1>{question.title}</h1>
        <p>{question.subtitle}</p>
        <div className="answer-list">
          {question.options.map(([title, trait], index) => (
            <button
              key={title}
              className={answers[quizStep] === index ? "selected" : ""}
              onClick={() => chooseAnswer(index)}
            >
              <span className="radio">
                <i />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{trait}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="quiz-note">
          <Icon name="heart" size={16} />
          <span>Your answers stay private. We only use them to improve your recommendations.</span>
        </div>
      </main>
      <div className="bottom-action sticky">
        <button
          className="primary-button"
          disabled={answers[quizStep] === undefined}
          onClick={finishQuestion}
        >
          {quizStep === questions.length - 1 ? "See my results" : "Next question"}{" "}
          <Icon name="chevron" />
        </button>
      </div>
    </div>
  );
}

export function PersonalityResultScreen({
  personality,
  completing,
  completionError,
  onComplete,
}: {
  personality: Personality;
  completing: boolean;
  completionError: string;
  onComplete: () => Promise<void>;
}) {
  return (
    <div className="phone-shell onboarding result-screen">
      <header className="simple-header">
        <Logo />
        <span>All done</span>
      </header>
      <main className="result-content">
        <div className="result-badge">
          <Icon name="sparkles" size={34} />
          <span className="mini-orbit one" />
          <span className="mini-orbit two" />
        </div>
        <span className="step-label">YOUR SOCIAL STYLE</span>
        <h1>
          {personality.name.split(" ")[0]}
          <br />
          <em>{personality.name.split(" ").slice(1).join(" ")}</em>
        </h1>
        <p>{personality.description}</p>
        <div className="trait-row">
          {personality.traits.map((trait) => (
            <span key={trait}>{trait}</span>
          ))}
        </div>
        <section className="match-formula">
          <span>
            <Icon name="heart" size={18} />
          </span>
          <div>
            <strong>How we’ll match you</strong>
            <p>Shared interests + compatible energy + nearby plans</p>
          </div>
        </section>
        <section className="nearby-community">
          <div>
            <div className="mini-avatar peach">
              <Icon name="racquet" size={17} />
            </div>
            <div className="mini-avatar sage">
              <Icon name="trail" size={17} />
            </div>
            <div className="mini-avatar lilac">
              <Icon name="dance" size={17} />
            </div>
          </div>
          <p>
            <strong>18 compatible students</strong>
            <br />
            are active near Tempe campus
          </p>
        </section>
      </main>
      <div className="bottom-action">
        {completionError && (
          <p className="auth-error" role="alert">
            {completionError}
          </p>
        )}
        <button className="primary-button" disabled={completing} onClick={() => void onComplete()}>
          {completing ? "Saving your profile…" : "Let’s touch grass"}{" "}
          {!completing && <Icon name="chevron" />}
        </button>
      </div>
    </div>
  );
}
