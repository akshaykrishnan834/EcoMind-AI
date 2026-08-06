import axios from "axios";

const API_URL = "http://localhost:5214/api/Auth";

export const registerUser = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
};

export const forgotPassword = async (email) => {
    return axios.post(
        "http://localhost:5214/api/Auth/ForgotPassword",
        {
            email
        }
    );
};

export const verifyOtp = async (email, otp) => {
    return axios.post(
        "http://localhost:5214/api/Auth/VerifyOtp",
        {
            email,
            otp
        }
    );
};
export const resetPassword = async (
    email,
    newPassword
) => {

    return axios.post(
        "http://localhost:5214/api/Auth/ResetPassword",
        {
            email,
            newPassword
        }
    );

};