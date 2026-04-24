import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

interface Props {
    phoneNumber: string;
    onBack: () => void;
    onVerify: (code: string) => void; 
    onResend: () => void; 
}

const OtpVerification: React.FC<Props> = ({ phoneNumber, onBack, onVerify, onResend }) => {
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const interval = timer > 0 && setInterval(() => setTimer(t => t - 1), 1000);
        return () => { if (interval) clearInterval(interval); };
    }, [timer]);

    const handleChange = (val: string, index: number) => {
        if (isNaN(Number(val))) return;
        const newOtp = [...otp];
        newOtp[index] = val.slice(-1);
        setOtp(newOtp);
        
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResendClick = () => {
        setTimer(30);
        onResend(); 
    };

    const handleVerifyClick = () => {
        const fullCode = otp.join("");
        if (fullCode.length === 6) {
            onVerify(fullCode);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card otp-view">
                <div className="otp-header">
                    <button className="back-btn-minimal" onClick={onBack}><FaArrowLeft /></button>
                    <h3>Nhập mã xác nhận</h3>
                </div>
                <p className="otp-subtitle">
                    Mã xác minh của bạn sẽ được gửi bằng tin nhắn đến <br/>
                    <strong>{phoneNumber}</strong>
                </p>
                <div className="otp-input-group">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            ref={el => (inputRefs.current[index] = el)}
                            type="text"
                            maxLength={1}
                            value={data}
                            onChange={e => handleChange(e.target.value, index)}
                            onKeyDown={e => handleKeyDown(e, index)}
                        />
                    ))}
                </div>
                <p className="otp-timer-text">
                    {timer > 0 ? (
                        `Vui lòng chờ ${timer} giây để gửi lại.`
                    ) : (
                        <span className="resend-link" onClick={handleResendClick}>
                            Gửi lại mã
                        </span>
                    )}
                </p>
                <button 
                    className="auth-submit-btn coral-btn" 
                    onClick={handleVerifyClick} 
                    disabled={otp.join("").length < 6}
                >
                    KẾ TIẾP
                </button>
            </div>
        </div>
    );
};

export default OtpVerification;