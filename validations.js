import { body } from "express-validator";

export const loginValidation =[
    body('email', 'неверный формат почты').isEmail(),
    body('password', 'неверный формат пароля').isLength({min:5}),
];

export const registerValidation =[
    body('email', 'неверный формат почты').isEmail(),
    body('password', 'неверный формат пароля').isLength({min:5}),
    body('fullName', 'неверный формат имя').isLength({min:3}),
    body('avatarUrl', 'неверный формат ссылки').optional().isURL(),
];
