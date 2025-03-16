import { useState } from "react"

export default function Modal({username, email, password, setUsername, setEmail, setPassword, handleAuth, isLogin, setErrorMessage, errorMessage, isModalOpen, setIsModalOpen, setIsLogin}) {

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        setErrorMessage('');
    };

    const toggleLoginSignup = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setUsername('');
        setErrorMessage('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">{isLogin ? 'Log In' : 'Sign Up'}</h2>
                    <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700">&times;</button>
                </div>
                {errorMessage && (
                    <div className="bg-red-100 text-red-800 p-3 text-center">
                        {errorMessage}
                    </div>
                )}
                <form className="space-y-4" onSubmit={handleAuth}>
                    {!isLogin && (
                        <>
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full p-2 border rounded"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </>
                    )}
                    <input
                        type="email"
                        placeholder="E-mail"
                        className="w-full p-2 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {!isLogin && <div className="text-xs text-gray-600">Password must be at least 6 characters long.</div>}
                    <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-sm mt-4 text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        className="text-gray-800 hover:underline"
                        onClick={toggleLoginSignup}
                    >
                        {isLogin ? ' Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    )
}