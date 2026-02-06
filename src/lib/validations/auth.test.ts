import { describe, it, expect } from 'vitest';
import { authSchema } from './auth';

describe('authSchema', () => {
    it('should validate correct input', () => {
        const input = {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User'
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
        const input = {
            email: 'invalid-email',
            password: 'password123'
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].code).toBe('invalid_string');
        }
    });

    it('should reject short password', () => {
        const input = {
            email: 'test@example.com',
            password: '123'
        };
        const result = authSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].code).toBe('too_small');
        }
        it('should validate input without optional fullName', () => {
            const input = {
                email: 'test@example.com',
                password: 'password123'
            };
            const result = authSchema.safeParse(input);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = ['plainaddress', '#@%^%#$@#$@#.com', '@example.com', 'Joe Smith <email@example.com>', 'email.example.com'];
            invalidEmails.forEach(email => {
                const result = authSchema.safeParse({ email, password: 'password123' });
                expect(result.success).toBe(false);
            });
        });

        it('should reject empty strings where required', () => {
            const result = authSchema.safeParse({ email: '', password: '' });
            expect(result.success).toBe(false);
        });

        it('should accept typical password complexity chars', () => {
            const result = authSchema.safeParse({ email: 'test@example.com', password: 'Password!123' });
            expect(result.success).toBe(true);
        });
    });
});
