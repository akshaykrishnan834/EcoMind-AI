// src/validations/loginValidation.js

export const validateField = (name, value) => {
    switch (name) {
        case "email":
            if (!value.trim()) {
                return "Email is required.";
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Enter a valid email address.";
            }

            return "";

        case "password":
            if (!value) {
                return "Password is required.";
            }

            return "";

        default:
            return "";
    }
};

export const validateForm = (formData) => {
    const errors = {};

    Object.keys(formData).forEach((field) => {
        if (field === "rememberMe") return;

        const error = validateField(field, formData[field]);

        if (error) {
            errors[field] = error;
        }
    });

    return errors;
};