import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, User, Mail, CreditCard, Calendar, MapPin, 
  Lock, Eye, EyeOff, ChevronRight, CheckCircle, Landmark,
  Camera, ChevronLeft, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import VoterIDCard from '../components/VoterIDCard';
import ElectionParticles from '../components/ElectionParticles';
import FaceCapture from '../components/FaceCapture';

const STATE_CONSTITUENCIES = {
  "Uttar Pradesh": ["Lucknow", "Varanasi", "Agra", "Kanpur", "Allahabad"],
  "Maharashtra": ["Mumbai North", "Pune", "Nagpur", "Nashik"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi"],
  "Tamil Nadu": ["Chennai Central", "Coimbatore", "Madurai", "Salem"],
  "Karnataka": ["Bangalore Central", "Mysore", "Hubballi"],
  "West Bengal": ["Kolkata North", "Darjeeling", "Howrah"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada"],
  "Telangana": ["Hyderabad", "Warangal"],
  "Kerala": ["Thiruvananthapuram", "Kochi"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar"],
  "Haryana": ["Gurgaon", "Faridabad"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior"],
  "Assam": ["Guwahati", "Dibrugarh"],
  "Odisha": ["Bhubaneswar", "Cuttack"],
  "Chhattisgarh": ["Raipur", "Bilaspur"],
  "Jharkhand": ["Ranchi", "Jamshedpur"],
  "Goa": ["North Goa", "South Goa"],
  "Himachal Pradesh": ["Shimla", "Dharamshala"],
  "Uttarakhand": ["Dehradun", "Nainital"],
  "Tripura": ["Agartala"],
  "Meghalaya": ["Shillong"],
  "Manipur": ["Imphal"],
  "Nagaland": ["Kohima"],
  "Mizoram": ["Aizawl"],
  "Sikkim": ["Gangtok"],
  "Arunachal Pradesh": ["Itanagar"]
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', voterID: '', aadhaarID: '',
    dob: '', state: '', password: '', 
    photoBase64: '', faceDescriptor: [],
    guardianName: '', gender: '', district: '', constituency: ''
  });
  const [registrationResult, setRegistrationResult] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const nextStep = () => {
    // Basic validation per step
    if (step === 1) {
      if (!form.name || !form.email || !form.voterID || !form.aadhaarID || !form.dob || !form.password) {
        return toast.error("Please fill all core identity fields.");
      }
      const birthYear = new Date(form.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 18) {
        return toast.error("Voter must be at least 18 years old.");
      }
    }
    if (step === 2) {
      if (!form.state || !form.constituency || !form.gender || !form.guardianName) {
        return toast.error("Location and profile details are mandatory.");
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleCapture = (img, descriptor) => {
    setForm(prev => ({ ...prev, photoBase64: img, faceDescriptor: descriptor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.photoBase64) return toast.error("Biometric face photo is required.");
    
    setLoading(true);
    try {
      const result = await register(form);
      setRegistrationResult(result);
      toast.success('Identity Secured! Voter ID Issued.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (registrationResult) {
    return (
      <div className="min-h-screen bg-ev-navy flex flex-col items-center justify-center p-6 pt-24">
        <ElectionParticles />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="ev-card p-10 max-w-2xl w-full text-center relative z-10 border-ev-gold/30">
          <div className="w-20 h-20 rounded-full bg-ev-green/10 flex items-center justify-center mb-6 mx-auto border-2 border-ev-green/30">
             <CheckCircle className="w-12 h-12 text-ev-green" />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Registration Certified</h2>
          <p className="text-ev-text-secondary text-xs font-mono uppercase tracking-[0.2em] mb-10">Digital ID Command Status: SECURED ✓</p>

          <VoterIDCard voter={registrationResult.voter} />

          <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full">
            <button onClick={() => navigate('/vote')} className="ev-btn-primary flex-1 py-4 flex items-center gap-3 justify-center">
              ENTRANCE VOTE CENTER <ChevronRight size={18} />
            </button>
            <Link to="/" className="ev-btn-outline flex-1 py-4 flex items-center justify-center font-bold">
              RETURN TO HOME
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ev-navy flex items-center justify-center p-6 pt-24 pb-12 overflow-x-hidden">
      <ElectionParticles />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="ev-card p-8 md:p-12 w-full max-w-2xl relative z-10">
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 flex flex-col gap-2">
               <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-ev-gold shadow-[0_0_10px_#D4AF37]' : 'bg-ev-navy-800'}`} />
               <p className={`text-[8px] font-black uppercase tracking-widest ${step >= i ? 'text-ev-gold' : 'text-ev-text-muted'}`}>
                 Step 0{i} {i === 1 ? 'Identity' : i === 2 ? 'Profile' : 'Biometric'}
               </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ACCOUNT INFO */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <FormLabel>Full Legal Name</FormLabel>
                      <FormInput icon={User} name="name" value={form.name} onChange={handleChange} placeholder="As per Aadhaar" />
                   </div>
                   <div className="md:col-span-2">
                      <FormLabel>Email Address</FormLabel>
                      <FormInput icon={Mail} name="email" value={form.email} onChange={handleChange} placeholder="voter@gov.in" />
                   </div>
                   <div>
                      <FormLabel>Voter ID Number</FormLabel>
                      <FormInput icon={CreditCard} name="voterID" value={form.voterID} onChange={handleChange} placeholder="EPIC 10-12 Chars" />
                   </div>
                   <div>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormInput icon={Shield} name="aadhaarID" value={form.aadhaarID} onChange={handleChange} placeholder="12 Digit ID" />
                   </div>
                   <div>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormInput icon={Calendar} name="dob" type="date" value={form.dob} onChange={handleChange} />
                   </div>
                   <div>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormInput icon={Lock} name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Min 8 chars" />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ev-text-muted hover:text-white transition-colors">
                           {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                   </div>
                </div>
                <button type="button" onClick={nextStep} className="ev-btn-primary w-full py-4 flex items-center justify-center gap-3">
                   SECURE ACCOUNT <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: PROFILE & LOCATION */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <FormLabel>Father / Husband Name</FormLabel>
                      <FormInput icon={UserPlus} name="guardianName" value={form.guardianName} onChange={handleChange} placeholder="Relative's Name" />
                   </div>
                   <div>
                      <FormLabel>State Selection</FormLabel>
                      <select name="state" value={form.state} onChange={handleChange} className="form-select-ev">
                        <option value="">Choose State</option>
                        {Object.keys(STATE_CONSTITUENCIES).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                   <div>
                      <FormLabel>Constituency</FormLabel>
                      <select name="constituency" value={form.constituency} onChange={handleChange} className="form-select-ev" disabled={!form.state}>
                        <option value="">Select Area</option>
                        {form.state && STATE_CONSTITUENCIES[form.state]?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <FormLabel>District</FormLabel>
                      <FormInput icon={MapPin} name="district" value={form.district} onChange={handleChange} placeholder="City/Town" />
                   </div>
                   <div>
                      <FormLabel>Gender</FormLabel>
                      <select name="gender" value={form.gender} onChange={handleChange} className="form-select-ev">
                        <option value="">Select Binary</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                   </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="ev-btn-outline flex-1 py-4 flex items-center justify-center gap-2">
                     <ChevronLeft size={18} /> BACK
                  </button>
                  <button type="button" onClick={nextStep} className="ev-btn-primary flex-[2] py-4 flex items-center justify-center gap-3">
                     VALIDATE PROFILE <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: BIOMETRIC SCAN */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center mb-4">
                   <p className="text-[10px] font-black text-ev-saffron uppercase tracking-[0.4em] mb-2 px-4 py-1 bg-ev-saffron/10 border border-ev-saffron/30 rounded-full inline-block">Secure Biometric Capture Required</p>
                </div>
                
                <FaceCapture onCapture={handleCapture} />
                
                <div className="flex gap-4">
                  <button type="button" onClick={prevStep} className="ev-btn-outline flex-1 py-4 flex items-center justify-center gap-2">
                     <ChevronLeft size={18} /> BACK
                  </button>
                  <button type="submit" disabled={loading || !form.photoBase64} className="ev-btn-primary flex-[2] py-4 flex items-center justify-center gap-3 disabled:opacity-50">
                     {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Shield size={20} /> CERTIFY ENROLLMENT</>}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          <p className="text-center text-ev-text-muted text-[10px] font-bold uppercase tracking-widest mt-8">
            Identity already exists?{' '}
            <Link to="/login" className="text-ev-gold hover:text-white transition-colors ml-1 underline underline-offset-4 decoration-ev-gold/30">
              Enter Login Sequence
            </Link>
          </p>
        </form>
      </motion.div>

    </div>
  );
}

function FormLabel({ children }) {
  return <label className="block text-[10px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-2">{children}</label>;
}

function FormInput({ icon: Icon, value, onChange, name, placeholder, type = "text" }) {
  return (
    <div className="relative group">
       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-ev-gold text-ev-text-muted transition-colors">
          <Icon size={16} />
       </div>
       <input 
          type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required
          className="w-full bg-ev-navy-800 border border-ev-surface-border rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:border-ev-gold outline-none transition-all placeholder:text-ev-text-muted/30"
       />
    </div>
  );
}
