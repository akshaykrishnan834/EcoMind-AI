import React, { useEffect } from 'react';
import Header from "../components/Header";
import { useNavigate } from 'react-router-dom';

const Citizen = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#f4f9f5] flex flex-col">
            <Header />
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-800">Citizen Dashboard</h1>
            </div>
        </div>
    );
};

export default Citizen;