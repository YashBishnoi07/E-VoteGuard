import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { useRef } from "react";

export default function VoterIDCard({ voter }) {
  const cardRef = useRef(null);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { 
      scale: 3, useCORS: true, backgroundColor: "#0D1B2A" 
    });
    const link = document.createElement("a");
    link.download = `VoterID_${voter.voterID}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const formatDOB = (dob) => {
    if (!dob) return "N/A";
    try {
      return new Date(dob).toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric"
      });
    } catch(e) { return "N/A"; }
  };

  const createdTime = voter.createdAt || new Date().toISOString();
  const issueDate = new Date(createdTime).toLocaleDateString("en-IN");
  const expiryDate = new Date(
    new Date(createdTime).setFullYear(new Date(createdTime).getFullYear() + 10)
  ).toLocaleDateString("en-IN");

  const voterHash = voter.voterHash || voter.hashedFingerprint || "HASH_NULL";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* THE CARD */}
      <div
        ref={cardRef}
        className="relative w-[420px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #0D1B2A 0%, #162032 60%, #1A2A40 100%)",
          border: "2px solid #D4AF37",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Tricolor top stripe */}
        <div className="flex h-3">
          <div className="flex-1 bg-ev-saffron" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-ev-green" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-3 border-b border-ev-gold/20">
          <div className="w-10 h-10 rounded-full border border-ev-gold flex items-center 
                          justify-center text-ev-gold font-bold text-xl bg-ev-navy-800">🏛️</div>
          <div>
            <p className="text-[10px] text-ev-gold tracking-[0.2em] font-black uppercase">
              Election Commission of India
            </p>
            <p className="text-[8px] text-ev-text-muted tracking-widest uppercase">
              Electors Photo Identity Card (EPIC)
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[7px] text-ev-text-muted uppercase">EPIC NO.</p>
            <p className="text-[11px] text-ev-gold font-mono font-bold tracking-wider">{voter.voterID}</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex gap-4 px-5 py-4 relative">
          {/* Left: Photo */}
          <div className="flex-shrink-0">
            <div className="w-[100px] h-[125px] rounded-lg overflow-hidden border-2 border-ev-gold/30 bg-ev-navy-800 flex items-center justify-center">
              {voter.photoBase64 ? (
                <img src={voter.photoBase64} alt="Voter"
                     className="w-full h-full object-cover grayscale" />
              ) : (
                <div className="text-4xl opacity-20">👤</div>
              )}
            </div>
            {/* Holographic strip */}
            <div className="mt-2 h-2.5 rounded-full overflow-hidden bg-ev-navy-800 border border-ev-gold/10">
              <div className="h-full w-full opacity-50 rainbow-animate" />
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <DetailRow label="Name" value={voter.name?.toUpperCase()} large />
            <DetailRow label="Relation" value={voter.guardianName || voter.guardian || voter.relation || "—"} />
            <DetailRow label="Birth Date" value={formatDOB(voter.dob || voter.dateOfBirth)} />
            <DetailRow label="Gender" value={voter.gender || voter.sex || "—"} />
            <DetailRow label="Location" value={`${voter.district || voter.city || "N/A"}, ${voter.state}`} />
            <DetailRow label="Constituency" value={voter.constituency || voter.area || "—"} />
          </div>
          
          {/* Seal Graphic */}
          <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
             <div className="w-16 h-16 border-4 border-ev-gold rounded-full flex items-center justify-center rotate-[-15deg]">
               <span className="text-xs font-black text-ev-gold">ECI SEAL</span>
             </div>
          </div>
        </div>

        {/* Footer: Hash + QR + Dates */}
        <div className="flex items-end justify-between px-5 pb-4 border-t border-ev-gold/10 pt-3 bg-black/20">
          <div className="flex flex-col gap-1">
            <p className="text-[7px] text-ev-text-muted tracking-widest uppercase">Secured Blockchain Hash</p>
            <p className="text-[9px] text-ev-gold font-mono break-all w-64 leading-tight">
              {voterHash.toUpperCase()}
            </p>
            <div className="mt-1 flex gap-4">
              <div>
                <p className="text-[6px] text-ev-text-muted uppercase">Issue Date</p>
                <p className="text-[10px] text-ev-text-primary font-mono">{issueDate}</p>
              </div>
              <div>
                <p className="text-[6px] text-ev-text-muted uppercase">Validity</p>
                <p className="text-[10px] text-ev-text-primary font-mono">{expiryDate}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-1">
            <div className="p-1 bgColor-white rounded-lg shadow-inner bg-white">
              <QRCodeSVG
                value={`${window.location.origin}/verify/${voterHash}`}
                size={64}
                level="M"
                fgColor="#0D1B2A"
              />
            </div>
            <p className="text-[7px] text-ev-text-muted uppercase">Verify Authenticity</p>
          </div>
        </div>

        {/* VALID Badge Overlay */}
        <div className="absolute top-[60%] right-[-10px] rotate-[-25deg] opacity-60">
            <div className="border-4 border-ev-green-500 text-ev-green-500 font-black text-xl px-4 py-1 rounded-xl">
               VALID
            </div>
        </div>
      </div>
      <div id="voter-json-debug" style={{display:'none'}} data-voter={JSON.stringify(voter)}></div>

      {/* Action Center */}
      <div className="flex gap-4">
        <button onClick={downloadCard}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest
                     bg-gradient-to-r from-ev-gold-800 to-ev-gold hover:from-ev-gold hover:to-ev-gold-400
                     text-ev-navy transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-ev-gold/20">
          📥 Download Digital EPIC
        </button>
      </div>

    </div>
  );
}

function DetailRow({ label, value, large }) {
  return (
    <div className="min-w-0">
      <p className="text-[7px] text-ev-text-muted tracking-widest uppercase mb-0.5">{label}</p>
      <p className={`text-ev-text-primary font-medium leading-relaxed ${large ? "text-[14px] font-black" : "text-[11px]"} pb-0.5`}>
        {value || "—"}
      </p>
    </div>
  );
}
