import { useState, useEffect } from 'react';

export default function Quiz({ topic, apiKey }) {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        generateQuiz();
    }, [topic]);

    const generateQuiz = async () => {
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        setCurrentIndex(0);
        setScore(0);
        setShowResults(false);
        setUserAnswers([]);
        setShowReview(false);

        try {
            // Updated model list for better compatibility
            const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.0-pro'];
            let success = false;
            let lastErr = null;

            const prompt = `Generate a 5-question multiple choice quiz about "${topic}". 
            Return ONLY a JSON array of objects. Each object must have:
            "question": string,
            "options": array of 4 strings,
            "correctAnswer": integer (0-3, index of the correct option).
            Do not include any other text or markdown formatting outside the JSON array.`;

            for (const model of models) {
                try {
                    console.log(`Trying quiz generation via ${model}`);
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }]
                            })
                        }
                    );

                    if (!response.ok) {
                        const errData = await response.json();
                        console.warn(`Model ${model} returned error:`, errData);
                        throw new Error(errData.error?.message || response.statusText);
                    }

                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (!text) {
                        console.warn(`Model ${model} returned empty text`);
                        throw new Error("Empty response from model");
                    }

                    // Robust JSON extraction
                    const jsonMatch = text.match(/\[[\s\S]*\]/);
                    if (!jsonMatch) {
                        console.warn(`Model ${model} returned non-JSON text:`, text);
                        throw new Error("No JSON array found in response");
                    }

                    const parsedQuestions = JSON.parse(jsonMatch[0]);

                    if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                        setQuestions(parsedQuestions);
                        success = true;
                        break;
                    } else {
                        throw new Error("Invalid or empty quiz array");
                    }
                } catch (e) {
                    console.warn(`Quiz generation failed for ${model}:`, e.message);
                    lastErr = e;
                    continue; // Continue to next model
                }
            }

            if (!success) {
                throw lastErr || new Error("All AI models failed to generate the quiz.");
            }
        } catch (err) {
            console.error("Quiz generation final error:", err);
            setError(`Unable to generate quiz at the moment. Please try again later or try a different topic.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionClick = (index) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === questions[currentIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }

        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentIndex] = index;
            return newAnswers;
        });
    };

    const handleNext = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResults(true);
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div className="quiz-loader" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid var(--glass-border)',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    margin: '0 auto 15px',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: 'var(--text-muted)' }}>Generating quiz for {topic}...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</p>
                <button
                    onClick={generateQuiz}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600'
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (showResults) {
        return (
            <div style={{ textAlign: 'center', padding: '30px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: 'var(--text-main)' }}>Quiz Completed!</h2>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: '800',
                    color: 'var(--primary)',
                    marginBottom: '20px'
                }}>
                    {score} / {questions.length}
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                    {score === questions.length ? "Perfect Score! You're a master!" :
                        score >= questions.length / 2 ? "Great job! You've got the basics down." :
                            "Keep studying! You'll get it next time."}
                </p>
                <button
                    onClick={generateQuiz}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        borderRadius: '15px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        marginRight: '15px'
                    }}
                >
                    Restart Quiz
                </button>
                <button
                    onClick={() => setShowReview(true)}
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        color: 'white',
                        borderRadius: '15px',
                        fontWeight: '600',
                        fontSize: '1rem'
                    }}
                >
                    Review Answers
                </button>
            </div>
        );
    }

    if (showReview) {
        return (
            <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h2 style={{ color: 'var(--text-main)' }}>Quiz Review</h2>
                    <button
                        onClick={() => setShowReview(false)}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'var(--text-main)',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Result
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '30px' }}>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} style={{
                            padding: '20px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)'
                        }}>
                            <h4 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>
                                {qIndex + 1}. {q.question}
                            </h4>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {q.options.map((opt, oIndex) => {
                                    const isCorrect = oIndex === q.correctAnswer;
                                    const isSelected = oIndex === userAnswers[qIndex];

                                    let style = {
                                        padding: '12px',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid transparent',
                                        color: 'var(--text-muted)'
                                    };

                                    if (isCorrect) {
                                        style.background = 'rgba(74, 222, 128, 0.1)';
                                        style.border = '1px solid rgba(74, 222, 128, 0.3)';
                                        style.color = '#4ade80';
                                    } else if (isSelected && !isCorrect) {
                                        style.background = 'rgba(239, 68, 68, 0.1)';
                                        style.border = '1px solid rgba(239, 68, 68, 0.3)';
                                        style.color = '#ef4444';
                                    }

                                    return (
                                        <div key={oIndex} style={style}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{opt}</span>
                                                {isCorrect && <span style={{ fontSize: '0.8rem' }}>(Correct)</span>}
                                                {isSelected && !isCorrect && <span style={{ fontSize: '0.8rem' }}>(Your Answer)</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Score: {score}</span>
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '25px', lineHeight: '1.4' }}>
                {currentQuestion.question}
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
                {currentQuestion.options.map((option, index) => {
                    let backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    let borderColor = 'var(--glass-border)';

                    if (isAnswered) {
                        if (index === currentQuestion.correctAnswer) {
                            backgroundColor = 'rgba(74, 222, 128, 0.2)';
                            borderColor = '#4ade80';
                        } else if (index === selectedOption) {
                            backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            borderColor = '#ef4444';
                        }
                    } else if (index === selectedOption) {
                        borderColor = 'var(--primary)';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionClick(index)}
                            style={{
                                padding: '15px 20px',
                                textAlign: 'left',
                                background: backgroundColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: '15px',
                                color: 'var(--text-main)',
                                fontSize: '1.05rem',
                                transition: 'all 0.2s ease',
                                cursor: isAnswered ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }}
                        >
                            <span style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.1)',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            {option}
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <button
                    onClick={handleNext}
                    style={{
                        marginTop: '30px',
                        width: '100%',
                        padding: '15px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '15px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {currentIndex + 1 === questions.length ? 'See Results' : 'Next Question'}
                </button>
            )}
        </div>
    );
}
