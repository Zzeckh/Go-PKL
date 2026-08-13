import React from 'react';
import { Eye, EyeOff, ArrowRight, GraduationCap, Briefcase, School, Sparkles, MapPin, CheckCircle2, Users, LineChart, Shield } from 'lucide-react';
import { AuthMode, UserRole } from '../types';

interface AuthScreenProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onSubmit: (payload: { name: string; email: string; password: string; role: UserRole }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode,
  setAuthMode,
  userRole,
  setUserRole,
  onSubmit
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const isLogin = authMode === 'login';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, password, role: userRole });
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm">
      
      {/* MOBILE VIEW */}
      <div className="lg:hidden w-full h-full relative overflow-hidden">
        {/* Login form */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'translateX(0)' : 'translateX(-28px)',
            transition: isLogin
              ? 'opacity 380ms ease 120ms, transform 440ms cubic-bezier(0.34,1.1,0.64,1) 120ms'
              : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: isLogin ? 'auto' : 'none',
          }}
        >
          <div className="min-h-full flex flex-col justify-center px-5 py-8">
            <MobileForm mode="login" userRole={userRole} setUserRole={setUserRole} showPassword={showPassword} setShowPassword={setShowPassword} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleSubmit} onSwitch={() => setAuthMode('register')} />
          </div>
        </div>
        {/* Register form */}
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? 'translateX(0)' : 'translateX(28px)',
            transition: !isLogin
              ? 'opacity 380ms ease 120ms, transform 440ms cubic-bezier(0.34,1.1,0.64,1) 120ms'
              : 'opacity 220ms ease, transform 220ms ease',
            pointerEvents: !isLogin ? 'auto' : 'none',
          }}
        >
          <div className="min-h-full flex flex-col justify-center px-5 py-8">
            <MobileForm mode="register" userRole={userRole} setUserRole={setUserRole} showPassword={showPassword} setShowPassword={setShowPassword} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleSubmit} onSwitch={() => setAuthMode('login')} />
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:block w-full h-full relative overflow-hidden">

        {/* LOGIN FORM — left half, fades + rises in */}
        <div
          className="absolute top-0 left-0 h-full w-1/2 p-8 xl:p-12 flex flex-col justify-center"
          style={{
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'scale(1) translateY(0px)' : 'scale(0.97) translateY(10px)',
            transition: isLogin
              ? 'opacity 420ms ease 320ms, transform 500ms cubic-bezier(0.34,1.2,0.64,1) 320ms'
              : 'opacity 200ms ease 0ms, transform 200ms ease 0ms',
            pointerEvents: isLogin ? 'auto' : 'none',
            zIndex: isLogin ? 20 : 10,
          }}
        >
          <div className="max-w-md w-full mx-auto">
            <AuthForm mode="login" userRole={userRole} setUserRole={setUserRole} showPassword={showPassword} setShowPassword={setShowPassword} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleSubmit} onSwitch={() => setAuthMode('register')} />
          </div>
        </div>

        {/* REGISTER FORM — right half, fades + rises in */}
        <div
          className="absolute top-0 right-0 h-full w-1/2 p-8 xl:p-12 flex flex-col justify-center"
          style={{
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? 'scale(1) translateY(0px)' : 'scale(0.97) translateY(10px)',
            transition: !isLogin
              ? 'opacity 420ms ease 320ms, transform 500ms cubic-bezier(0.34,1.2,0.64,1) 320ms'
              : 'opacity 200ms ease 0ms, transform 200ms ease 0ms',
            pointerEvents: !isLogin ? 'auto' : 'none',
            zIndex: !isLogin ? 20 : 10,
          }}
        >
          <div className="max-w-md w-full mx-auto">
            <AuthForm mode="register" userRole={userRole} setUserRole={setUserRole} showPassword={showPassword} setShowPassword={setShowPassword} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleSubmit} onSwitch={() => setAuthMode('login')} />
          </div>
        </div>

        {/* SLIDING BLUE CARD — sweeps left↔right */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full z-30"
          style={{
            transform: isLogin ? 'translateX(100%)' : 'translateX(0%)',
            transition: 'transform 680ms cubic-bezier(0.65,0,0.35,1)',
            willChange: 'transform',
          }}
        >
          <div className="w-full h-full p-4">
            <div className="w-full h-full bg-gradient-to-br from-[#8CCDE9]/95 to-[#EBFBFA]/95 backdrop-blur-md rounded-[24px] overflow-hidden border border-white/80 shadow-2xl shadow-[#8CCDE9]/20 relative">

              {/* Login graphic — fades in after card settles */}
              <div
                className="absolute inset-0 p-10 flex flex-col justify-between"
                style={{
                  opacity: isLogin ? 1 : 0,
                  transform: isLogin ? 'translateX(0px)' : 'translateX(-24px)',
                  transition: isLogin
                    ? 'opacity 380ms ease 380ms, transform 460ms cubic-bezier(0.34,1.1,0.64,1) 360ms'
                    : 'opacity 180ms ease 0ms, transform 180ms ease 0ms',
                  pointerEvents: isLogin ? 'auto' : 'none',
                }}
              >
                <DecorativeGraphic mode="login" />
              </div>

              {/* Register graphic — fades in after card settles */}
              <div
                className="absolute inset-0 p-10 flex flex-col justify-between"
                style={{
                  opacity: !isLogin ? 1 : 0,
                  transform: !isLogin ? 'translateX(0px)' : 'translateX(24px)',
                  transition: !isLogin
                    ? 'opacity 380ms ease 380ms, transform 460ms cubic-bezier(0.34,1.1,0.64,1) 360ms'
                    : 'opacity 180ms ease 0ms, transform 180ms ease 0ms',
                  pointerEvents: !isLogin ? 'auto' : 'none',
                }}
              >
                <DecorativeGraphic mode="register" />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const AuthForm = ({ mode, userRole, setUserRole, showPassword, setShowPassword, name, setName, email, setEmail, password, setPassword, onSubmit, onSwitch }: any) => {
  const isLogin = mode === 'login';
  
  return (
    <div className="space-y-5">
      <div>
        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-xl border border-slate-700">
          Cx
        </div>
        <h2 className="text-3xl font-extrabold text-black tracking-tight">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-sm text-black/50 mt-2 font-medium">
          {isLogin ? 'Enter your credentials to access your dashboard' : 'Join the Crextio portal to manage your internship'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 pt-2">
              {/* Role Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-black/50 mb-2">Select your role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'intern', icon: GraduationCap, label: 'Student' },
                    { id: 'mentor', icon: Briefcase, label: 'Mentor' },
                    { id: 'teacher', icon: School, label: 'Teacher' },
                    { id: 'hubin', icon: Shield, label: 'Hubin' }
                  ].map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setUserRole(role.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                        userRole === role.id
                          ? 'bg-black text-white border-black shadow-lg scale-105 transform'
                          : 'bg-white/80 text-black/60 border-white shadow-sm hover:bg-white'
                      }`}
                    >
                      <role.icon className={`w-4 h-4 ${userRole === role.id ? 'text-white' : 'opacity-70'}`} />
                      <span>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!isLogin && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-black/50 mb-1">Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="John Doe" className="w-full bg-white/80 border border-white shadow-sm rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/40" required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-black/50 mb-1">Institution</label>
                    <input type="text" placeholder="School Name" className="w-full bg-white/80 border border-white shadow-sm rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/40" required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-black/50 mb-1">Email address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full bg-white/80 border border-white shadow-sm rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/40" required />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-black/50">Password</label>
                  {isLogin && <a href="#" className="text-xs font-bold text-black hover:text-black/70 underline transition-colors">Forgot password?</a>}
                </div>
                <div className="relative">
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full bg-white/80 border border-white shadow-sm rounded-xl px-4 py-2.5 text-sm pr-10 focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/40" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-black/40 hover:text-black/60 transition-colors">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-black/20 hover:shadow-black/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4">
          <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-xs text-black/50 pt-4 font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={onSwitch} className="font-extrabold text-black hover:text-black/70 underline transition-colors">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
};

const MobileForm = ({ mode, userRole, setUserRole, showPassword, setShowPassword, name, setName, email, setEmail, password, setPassword, onSubmit, onSwitch }: any) => {
  const isLogin = mode === 'login';
  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg border border-slate-700 shrink-0">
          Cx
        </div>
        <div>
          <div className="font-extrabold text-black text-xl tracking-tight leading-tight">
            {isLogin ? 'Welcome back' : 'Create account'}
          </div>
          <div className="text-xs text-black/50 font-medium">
            {isLogin ? 'Sign in to your PKL portal' : 'Join the Crextio internship portal'}
          </div>
        </div>
      </div>

      {/* Role pills */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider font-bold text-black/40 mb-2">Your role</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'intern', icon: GraduationCap, label: 'Student' },
            { id: 'mentor', icon: Briefcase, label: 'Mentor' },
            { id: 'teacher', icon: School, label: 'Teacher' },
            { id: 'hubin', icon: Shield, label: 'Hubin' }
          ].map(role => (
            <button
              key={role.id}
              type="button"
              onClick={() => setUserRole(role.id)}
              className={`py-3 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                userRole === role.id
                  ? 'bg-black text-white border-black shadow-lg'
                  : 'bg-white/70 text-black/60 border-white/80 shadow-sm active:scale-95'
              }`}
            >
              <role.icon className={`w-4 h-4 ${userRole === role.id ? 'text-white' : 'opacity-60'}`} />
              {role.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-black/40 mb-1.5">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                type="text"
                placeholder="John Doe"
                className="w-full bg-white/80 border border-white/80 shadow-sm rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/30"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-black/40 mb-1.5">Institution</label>
              <input
                type="text"
                placeholder="School / Company Name"
                className="w-full bg-white/80 border border-white/80 shadow-sm rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/30"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-bold text-black/40 mb-1.5">Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="w-full bg-white/80 border border-white/80 shadow-sm rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-black/20 outline-none transition-all placeholder:text-black/30"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-black/40">Password</label>
            {isLogin && (
              <a href="#" className="text-xs font-bold text-black hover:text-black/70 underline transition-colors">
                Forgot?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-white/80 border border-white/80 shadow-sm rounded-2xl px-4 py-3.5 text-sm pr-12 focus:ring-2 focus:ring-black/20 outline-none transition-all"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 active:text-black/60">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-black/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
        >
          <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-sm text-black/50 pt-2 font-medium">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={onSwitch} className="font-extrabold text-black underline">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
};

const DecorativeGraphic = ({ mode }: { mode: 'login' | 'register' }) => (
  <>
    <div className="relative z-10 space-y-4">
      <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-black/80 border border-white shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        {mode === 'login' ? 'Integrated PKL Portal' : 'Join 100+ Companies'}
      </div>
      <h3 className="text-4xl font-extrabold text-black/80 tracking-tight leading-tight max-w-sm">
        {mode === 'login' 
          ? 'Manage your internship activities in one place.' 
          : 'Start your professional journey with Crextio.'}
      </h3>
    </div>
    
    <div className="relative z-10 w-full max-w-sm self-end space-y-3">
       {mode === 'login' ? (
         <>
           <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
             <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
               <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center"><MapPin className="w-5 h-5 text-black" /></div>
               <div>
                 <div className="text-sm font-bold text-black/80">Geofence Check-in</div>
                 <div className="text-xs text-black/50">Tokopedia Tower</div>
               </div>
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-black/80">
               <CheckCircle2 className="w-4 h-4 text-black" /> Validated location
             </div>
           </div>
           <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
             <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-bold text-black/80">Daily Logbook</div>
                <span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full font-bold">Approved</span>
             </div>
             <div className="h-2 bg-slate-100 rounded-full w-3/4 mb-2"></div>
             <div className="h-2 bg-slate-100 rounded-full w-1/2"></div>
           </div>
         </>
       ) : (
         <>
           <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
             <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-3">
               <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center"><Users className="w-5 h-5 text-black" /></div>
               <div>
                 <div className="text-sm font-bold text-black/80">Mentorship Pairing</div>
                 <div className="text-xs text-black/50">Connect with industry experts</div>
               </div>
             </div>
             <div className="flex items-center -space-x-2">
               {[1, 2, 3].map(i => (
                 <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-6 h-6 rounded-full border-2 border-white" alt="Avatar" />
               ))}
               <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold">+12</div>
             </div>
           </div>
           <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
             <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-black/60" />
                  <div className="text-sm font-bold text-black/80">Skill Progress</div>
                </div>
                <span className="text-[10px] bg-black/10 text-black px-2.5 py-1 rounded-full font-bold">Level Up</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
               <div className="bg-black h-1.5 rounded-full" style={{ width: '75%' }}></div>
             </div>
             <div className="text-[9px] text-black/50 text-right">75% to Next Milestone</div>
           </div>
         </>
       )}
    </div>
    
    {/* Background Shapes */}
    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/30 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-black/5 rounded-full blur-3xl pointer-events-none"></div>
  </>
);
