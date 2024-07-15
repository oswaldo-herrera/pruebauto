import axios from "axios";
import { ApiOperationsUrl } from '../../constants/api/site';
export const ReservationEndpoint = "reservations"
export const TokenReservationEndpoint = "reservation_token"

export class Reservation {
    constructor(data){
        this.id = data.id;
        this.opera_code = data.opera_code;
        this.pax = data.pax;
        this.user_extension = data.user_extension;
        this.user_extension_name = data.user_extension_name;
        this.contact = data.contact;
        this.country = data.country;
        this.email = data.email;
        this.department_cecos = data.department_cecos;
        this.memberships = data.memberships;
        this.address = data.address;
        this.reservation_date = data.reservation_date;
        this.sale_type = data.sale_type;
        this.amount = data.amount;
        this.property = data.property;
        this.comments = data.comments;
        this.reservation_services = data.reservation_services.map((reservation_service)=>new ReservationService(reservation_service))
    }
}

export class ReservationService {
    constructor(data){
        this.id = data.id;
        this.reservation = data.reservation;
        this.asignment = data.asignment;
        this.date = data.date;
        this.confirmation = data.confirmation;
        this.service = data.service;
        this.service_name = data.service_name;
        this.origin = data.origin;
        this.origin_name = data.origin_name;
        this.destination = data.destination;
        this.destination_name = data.destination_name;
        this.room = data.room;
        this.transfer_type = data.transfer_type;
        this.adults = data.adults;
        this.childs = data.childs;
        this.operation_type = data.operation_type;
        this.operation_type_name = data.operation_type_name;
        this.flight = data.flight;
        this.flight_field = data.flight_field;
        this.flight_code = data.flight_code;
        this.flight_time = data.flight_time;
        this.real_flight_time = data.real_flight_time;
        this.pick_up_time = data.pick_up_time;
        this.pick_up_time_data = data.pick_up_time_data;
        this.real_pick_up_time = data.real_pick_up_time;
        this.comments = data.comments;
        this.no_show = data.no_show;
        this.unit = data.unit;
        this.valid_sale = data.valid_sale;
    }
}

export async function getAllReservations(parameters) {
    return await axios.get(`${ApiOperationsUrl}${ReservationEndpoint}/`, { params: parameters })
    .then((result) => {
        const results = result.data.results && typeof result.data.results !== "undefined" ? result.data.results : [];
        return results.map((item) =>{ return new Reservation(item)});
    });
}
  
export async function getReservation(id) {
    return await axios.get(`${ApiOperationsUrl}${ReservationEndpoint}/${id}/`).then(result => {
        return result.data
    });
}

export async function getTokenReservation(uid) {
    return await axios.get(`${ApiOperationsUrl}${TokenReservationEndpoint}/${uid}/`).then(result => {
        return result.data
    });
}

export async function sendReservationEmail(id) {
    return await axios.get(`${ApiOperationsUrl}reservation_confirmation_report_send_email/${id}/`).then(result => {
        return result.data
    });
}

export async function createReservation(ReservationData) {
    return await axios.post(`${ApiOperationsUrl}${ReservationEndpoint}/`, ReservationData).then(result => result.data);
}
  
export async function updateReservation(id, ReservationData) {
    return await axios.put(`${ApiOperationsUrl}${ReservationEndpoint}/${id}/`, ReservationData).then(result => result.data);
}

export async function createTokenReservation(ReservationData) {
    return await axios.post(`${ApiOperationsUrl}${TokenReservationEndpoint}/`, ReservationData).then(result => result.data);
}

export async function updateTokenReservation(uid, ReservationData) {
    return await axios.put(`${ApiOperationsUrl}${TokenReservationEndpoint}/${uid}/`, ReservationData).then(result => result.data);
}