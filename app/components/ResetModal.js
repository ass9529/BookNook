'use client';

import { Baloo_2 } from 'next/font/google';
import { useState } from 'react';
import supabase from '../supabaseClient';

const headerFont = Baloo_2({
    weight: ['400', '800'],
    subsets: ['latin'],
});

export default function ResetModal({
    isModalOpen,
    setIsModalOpen
}) {

    const [password, setPassword] = useState();
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("")
    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handlePasswordReset = async () => {
        const { data, error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setErrorMessage(error)
            console.log("That didn't work", error);
        }
        else {
            setSuccessMessage("Password changed!")
        }
    }

    return (
        isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-xl font-bold text-black ${headerFont.className}`}>
                            Reset Password
                        </h2>
                        <button
                            onClick={closeModal}
                            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <input
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2 border rounded-md text-black bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                className={`text-sm text-gray-600 hover:underline ${headerFont.className}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {handlePasswordReset()}}
                                type="submit"
                                className={`bg-red-200 hover:bg-red-300 text-black font-semibold px-4 py-2 rounded ${headerFont.className}`}
                            >
                                Reset
                            </button>
                        </div>
                        {errorMessage && (
                            <p className="text-sm text-red-600">{errorMessage}</p>
                        )}
                        {successMessage && (
                            <p className="text-sm text-green-600">{successMessage}</p>
                        )}
                    </div>
                </div>
            </div>
        )
    );
}
