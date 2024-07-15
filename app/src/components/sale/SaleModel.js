import axios from "axios";
import { ApiSalesUrl } from '../../constants/api/site';
export const SaleEndpoint = "sales"
export const SaleTokenEndpoint = "sale_token"

export class Sale {
    constructor(data){
        this.id = data.id;
        this.status = data.status;
        this.name_pax = data.name_pax;
        this.email = data.email;
        this.sale_service_fee = data.sale_service_fee;
        this.service_fee = data.service_fee;
        this.user_extension = data.user_extension;
        this.user_extension_name = data.user_extension_name;
        this.representative = data.representative;
        this.representative_name = data.representative_name;
        this.sale_key = data.sale_key;
        this.sale_key_manual = data.sale_key_manual;
        this.sale_reservation_id = data.sale_reservation_id;
        this.reservation_service = data.reservation_service;
        this.service = data.service;
        this.service_data = data.service_data;
        this.service_date = data.service_date;
        this.service_rate = data.service_rate;
        this.service_rate_data = data.service_rate_data;
        this.time = data.time;
        this.schedule = data.schedule;
        this.schedule_data = data.schedule_data;
        this.schedule_time = data.schedule_time;
        this.schedule_max = data.schedule_max;
        this.schedule_reserved = data.schedule_reserved;
        this.sale_date = data.sale_date;
        this.sale_type = data.sale_type;
        this.sale_type_data = data.sale_type_data;
        this.client_type = data.client_type;
        this.client_type_data = data.client_type_data;
        this.adults = data.adults;
        this.childs = data.childs;
        this.discount_type = data.discount_type;
        this.discount = data.discount;
        this.overcharged = data.overcharged;
        this.hotel = data.hotel;
        this.hotel_name = data.hotel_name;
        this.room = data.room;
        this.confirm_provider = data.confirm_provider;
        this.comments_coupon = data.comments_coupon;
        this.comments = data.comments;
        this.property = data.property;
        this.sale_payments = data.sale_payments.map((sale_payment)=>new SalePayment(sale_payment))
    }
}

export class SalePayment {
    constructor(data){
        this.id = data.id;
        this.sale = data.sale;
        this.authorization = data.authorization;
        this.amount = parseFloat(data.amount);
        this.department_cecos = data.department_cecos;
        this.department_cecos_data = data.department_cecos_data;
        this.payment_method = data.payment_method;
        this.payment_method_data = data.payment_method_data;
        this.room_charge_data = data.room_charge_data?data.room_charge_data:null;
        this.credit_charge_data = data.credit_charge_data?data.credit_charge_data:null;
        this.store_card_charge_data = data.store_card_charge_data?data.store_card_charge_data:null;
    }
}

export async function getAllSales(parameters) {
    return await axios.get(`${ApiSalesUrl}${SaleEndpoint}/`, { params: parameters })
    .then((result) => {
        const results = result.data.results && typeof result.data.results !== "undefined" ? result.data.results : [];
        return results.map((item) =>{ return new Sale(item)});
    });
}
  
export async function getSale(id) {
    return await axios.get(`${ApiSalesUrl}${SaleEndpoint}/${id}/`).then(result => {
        return result.data
    });
}

export async function getTokenSale(uid) {
    return await axios.get(`${ApiSalesUrl}sale_token/${uid}/`).then(result => {
        return result.data
    });
}

export async function sendSaleEmail(id) {
    return await axios.get(`${ApiSalesUrl}sale_coupon_send_email/${id}/`).then(result => {
        return result.data
    });
}

export async function createSale(SaleData,discount_data) {
    let data = Object.assign(SaleData,{
        'discount_data':discount_data
    })
    return await axios.post(`${ApiSalesUrl}${SaleEndpoint}/`, data).then(result => result.data);
}
  
export async function updateSale(id, SaleData,discount_data) {
    let data = Object.assign(SaleData,{
        'discount_data':discount_data
    })
    return await axios.put(`${ApiSalesUrl}${SaleEndpoint}/${id}/`, data).then(result => result.data);
}

export async function createSaleToken(SaleData) {
    return await axios.post(`${ApiSalesUrl}${SaleTokenEndpoint}/`, SaleData).then(result => result.data);
}