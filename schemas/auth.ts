import { z } from "zod";

const PASSWORD_SPECIALS = "!@#$%^&*_-+=?.,:;";
const passwordSpecialRegex = /[!@#$%^&*_\-+=?.,:;]/;
const passwordAllowedCharsRegex = /^[A-Za-z\d!@#$%^&*_\-+=?.,:;]+$/;

export const registerSchema = z.object({
    email: z.email("Email invalide.").transform((value) => value.trim().toLowerCase()),

    username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.")
    .max(30, "Le nom d'utilisateur doit contenir au maximum 30 caractères.")
    .regex(
        /^[a-z0-9_.-]+$/,
        "Le nom d'utilisateur ne peut contenir que des lettres minuscules, chiffres, points, tirets et underscores.",
    ),

    password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
    .max(100, "Le mot de passe doit contenir au maximum 100 caractères.")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule.")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule.")
    .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre.")
    .regex(
        passwordSpecialRegex,
        `Le mot de passe doit contenir au moins un caractère spécial parmi : ${ PASSWORD_SPECIALS }`,
    )
    .regex(
        passwordAllowedCharsRegex,
        `Le mot de passe contient des caractères non autorisés. Caractères spéciaux autorisés : ${ PASSWORD_SPECIALS }`,
    ),
});

export const loginSchema = z.object({
    identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "L'identifiant est requis."),
    password: z.string().min(1, "Le mot de passe est requis."),
});