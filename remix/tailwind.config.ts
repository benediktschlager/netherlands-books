import type {Config} from 'tailwindcss'
import {blackA, violet, mauve} from '@radix-ui/colors'

export default {
    content: ["./app/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ...blackA,
                ...violet,
                ...mauve,
            },

            keyframes: {
                'btn-pressed': {
                    '0%': {transform: 'translate(0px)'},
                    '50%': {transform: 'translate(8px, 8px)'},
                    '80%': {transform: 'translate(-3px, -3px)'},
                    '100%': {transform: 'translate(0px)'},
                },
            },

            animation: {
                'btn-pressed': 'btn-pressed .5s ease'
            }

        },
    },
    plugins: [],
} satisfies Config

