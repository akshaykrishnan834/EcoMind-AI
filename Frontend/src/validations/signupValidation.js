// src/validations/signupValidation.js

export const validateField = (name, value, formData) => {
    switch (name) {
        case "fullName":
            if (!value.trim()) {
                return "Full Name is required.";
            }

            if (value.trim().length < 3) {
                return "Full Name must contain at least 3 characters.";
            }

            if (!/^[A-Za-z ]+$/.test(value)) {
                return "Only alphabets and spaces are allowed.";
            }

            return "";

        case "email":
            if (!value || !value.trim()) {
                return "Email Address is required.";
            }

            const trimmedEmail = value.trim();
            const atCount = (trimmedEmail.match(/@/g) || []).length;
            const hasSpace = /\s/.test(value);
            const isValidFormat = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail);

            if (hasSpace || atCount !== 1 || !isValidFormat) {
                return "Please enter a valid email address.";
            }

            return "";

        case "phone":
        case "phoneNumber":
            if (!value || !value.trim()) {
                return "Phone number is required.";
            }

            const cleanPhone = value.replace(/\D/g, "");

            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                return "Please enter a valid Indian mobile number.";
            }

            return "";

        case "password":
            if (!value) {
                return "Password is required.";
            }

            if (value.length < 8) {
                return "Password must be at least 8 characters.";
            }

            if (!/[A-Z]/.test(value)) {
                return "Password must contain one uppercase letter.";
            }

            if (!/[a-z]/.test(value)) {
                return "Password must contain one lowercase letter.";
            }

            if (!/[0-9]/.test(value)) {
                return "Password must contain one number.";
            }

            if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                return "Password must contain one special character.";
            }

            return "";

        case "confirmPassword":
            if (!value) {
                return "Confirm Password is required.";
            }

            if (value !== formData.password) {
                return "Passwords do not match.";
            }

            return "";

        case "agreeTerms":
            if (!value) {
                return "Please accept Terms & Conditions.";
            }

            return "";

        default:
            return "";
    }
};

export const validateForm = (formData) => {
    const errors = {};

    Object.keys(formData).forEach((field) => {
        const error = validateField(field, formData[field], formData);

        if (error) {
            errors[field] = error;
        }
    });

    return errors;
};