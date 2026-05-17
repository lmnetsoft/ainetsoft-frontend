import api from './api';

export const getProvinces = async () => {
    try {
        const response = await api.get('/v1/shipping/provinces');
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách Tỉnh/Thành:", error);
        return [];
    }
};

export const getDistricts = async (provinceId: number) => {
    try {
        const response = await api.get(`/v1/shipping/districts/${provinceId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách Quận/Huyện:", error);
        return [];
    }
};

export const getWards = async (districtId: number) => {
    try {
        const response = await api.get(`/v1/shipping/wards/${districtId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách Phường/Xã:", error);
        return [];
    }
};
