
export function getVisibleField(field,report){
    if(field === "date_filter"){
        return report === "summary_by_sales_types_services" ||
            report === "summary_by_services" ||
            report === "summary_by_providers_services";
    }
    if(field === "just_import"){
        return report === "summary_by_sales_types_services" ||
            report === "summary_by_services";
    }
    if(field === "with_out_tax"){
        return report === "by_representative" ||
            report === "report_sales_by_representatives_and_providers";
    }
    if(field === "summary"){
        return report === "report_by_payment_method";
    }
    if(field === "representatives"){
        return report === "by_representative" ||
            report === "summary_by_representatives" ||
            report === "summary_by_representatives_services"||
            report === "report_by_payment_method" ||
            report === "report_refund_by_representatives" ||
            report === "report_sales_with_discount" ||
            report === "report_sales_by_representatives_and_providers";
    }
    if(field === "sale_types"){
        return report === "summary_by_sales_types_services" ||
            report === "summary_by_representatives_services" ||
            report === "summary_by_sale_types" ||
            report === "summary_by_services" ||
            report === "report_by_payment_method" ||
            report === "report_sale_cost_daily" ||
            report === "summary_by_providers_services" ||
            report === "report_sale_by_sale_type_and_hotel";
    }
    if(field === "hotels"){
        return report === "summary_by_sales_types_services" ||
            report === "summary_by_services" ||
            report === "summary_by_hotel" ||
            report === "report_sale_by_sale_type_and_hotel";
    }
    if(field === "services"){
        return report === "report_sales_pax_by_services";
    }
    if(field === "providers"){
        return report === "summary_by_providers_services" ||
            report === "summary_by_representatives_services" ||
            report === "report_sales_by_representatives_and_providers";
    }
    return false
}

export function getFormatEnable(report){
    return true;
}

export function getTitle(report){
    switch(report){
        case "by_representative":
            return "1. Detalle por representante";
        case "summary_by_representatives":
            return "2. Resumen por representante";
        case "summary_by_sales_types_services":
            return "3. Resumen por Tipo de venta y Servicio";
        case "summary_by_services":
            return "4. Resumen por servicio";
        case "summary_by_hotel":
            return "5. Resumen por hotel";
        case "sales_consecutive":
            return "6. Consecutivo de cupones";
        case "summary_by_representatives_services":
            return "7. Ventas por Tipo de venta, Representante y Servicio";
        case "summary_by_sale_types":
            return "8. Resumen por Tipo de venta";
        case "report_sale_by_sale_type_and_hotel":
            return "A. Ventas por Tipo de venta y Hotel";
        case "report_sale_cost_daily":
            return "B. Detalle Venta y Costo Diario";
        case "report_refund_by_representatives":
            return "F. Cupones Reembolsados";
        case "report_sales_with_discount":
            return "G. Cupones con descuentos";
        case "report_sales_by_representatives_and_providers":
            return "H. Ventas por representante y proveedor";
        case "report_by_payment_method":
            return "I. Cupones x Rep. y F. Pago";
        case "report_sales_pax_by_services":
            return "J. Lista de Pax por excursión";
        case "summary_by_providers_services":
            return "K. Ventas x Tipo de ventas, Proveedor y Servicio";
    }
}