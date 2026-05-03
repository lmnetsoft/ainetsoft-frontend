import api from './api';

export const getMyWallet = async () => {
    const response = await api.get('/wallets/me');
    return response.data;
};

export const getMySavedVouchers = async () => {
    const response = await api.get('/wallets/me/vouchers');
    return response.data;
};

export const saveVoucher = async (voucherId: string) => {
    const response = await api.post(`/wallets/me/vouchers/${voucherId}`);
    return response.data;
};

export const removeVoucher = async (voucherId: string) => {
    const response = await api.delete(`/wallets/me/vouchers/${voucherId}`);
    return response.data;
};