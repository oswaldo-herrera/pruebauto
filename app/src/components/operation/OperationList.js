import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input, FormGroup, Label, Tooltip, UncontrolledTooltip } from "reactstrap";
import { ApiOperationsUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import { getProfile } from '../user/UserModel';
import ModalOperationDate from './ModalOperationDate';
import ModalOperationAsigment from './ModalOperationAsigment';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import ModalOperationUnit from './ModalOperationUnit';
import ModalOperationFilterReport from './ModalOperationFilterReport';
class OperationList extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectReservationService = this.onChangeSelectReservationService.bind(this);
        this.state={
            reservation_services:[],
            units_colors:[
                {
                    text:"black",
                    bg:"230,230,230"
                },{
                    text:"white",
                    bg:"128,128,128"
                }
            ],
            asigment:false,
            params:{
                start_date: "",
                due_date: "",
            },
            date:"",
            modal_operations:{
                operations:[],
                open:false
            },
            modal_properties:{
                type:'property',
                isopen:true,
                filter:"OP",
                value:null
            },
            modal_asigment:{
                reservation_services:[],
                date:"",
                unit:null,
                unit_code:null,
                is_private:null,
                value:0,
                property:null,
            },
            modal_reasigment:{
                reservation_services:[],
                reasigment:false,
            },
            modal_filter:{
                open:false,
                params:{
                    format:"download",
                    type:"pdf",
                    type_filter:"none",
                    unit_check:false,
                    unit:"",
                    hotel_check:false,
                    hotels:[],
                    providers:[]
                },
                options_hotels: [],
                options_providers: [],
            }
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    refreshOperations(){
        axios.get(`${ApiUrl}operations/operations_list/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    reservation_services:[],
                    modal_operations:{
                        operations:res.data,
                        open:true
                    }
                });
            })
    };

    refreshList(){
        axios.get(`${ApiUrl}operations/operations_list_date/`,{
                params: {
                    date:this.state.date,
                    property:this.state.params.property
                },
            }).then(res=>{
                let units = new Array
                let hotels = new Array
                for (const element of res.data.operation) {
                    if(element.unit!==null){
                        let unit = units.find((unit)=>unit.id===element.unit)
                        if(unit!==undefined&&!unit.is_priviate){
                            unit.pax_total += (element.adults + element.childs);
                            element.pax_total = unit.pax_total;
                        } else if(unit!==undefined&&unit.is_priviate){
                            element.pax_total = element.adults + element.childs;
                        } else if(unit===undefined){
                            element.pax_total = element.adults + element.childs;
                            unit = {
                                id:element.unit,
                                is_priviate:element.unit_is_private,
                                pax_total:element.adults + element.childs,
                            };
                            units.push(unit);
                        }
                    } else {
                        element.pax_total = 0
                    }
                    element.selected = false;
                    switch(element.transfer_type){
                        case "DEPARTURES":
                            if(hotels.find((hotel)=>hotel.id==element.origin)===undefined){
                                hotels.push({
                                    id:element.origin,
                                    name:element.origin_name,
                                })
                            }
                            break;
                        default:
                            if(hotels.find((hotel)=>hotel.id==element.destination)===undefined){
                                hotels.push({
                                    id:element.destination,
                                    name:element.destination_name,
                                })
                            }
                            break;
                    }
                }
                this.setState(function (prevState) {
                    return {
                        reservation_services:res.data.operation,
                        modal_filter:{
                            ...prevState.modal_filter,
                            options_hotels: hotels,
                            options_providers:res.data.providers
                        }
                    };
                });
            })
    };

    componentDidMount(){
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: ""
                },
            };
        });
    }

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_operations: {
                    ...prev_State.modal_operations,
                    open: false,
                },
                modal_asigment: {
                    ...prev_State.modal_asigment,
                    reservation_services:[],
                    date:"",
                    unit:null,
                    unit_code:null,
                    is_private:null,
                    value:0,
                    property:null,
                },
                modal_reasigment: {
                    ...prev_State.modal_reasigment,
                    reservation_services:[],
                    reasigment:false
                },
                modal_filter:{
                    ...prev_State.modal_filter,
                    open:false,
                }
            };
        });
	}

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    params:{
                        ...prev_State.params,
                        property:value
                    },
                };
            }
        );
	}

    handleReservationServiceAsignment = () => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_asigment: {
                        ...prev_State.modal_asigment,
                        reservation_services:[],
                        date:"",
                        unit:null,
                        unit_code:null,
                        is_private:null,
                        value:0,
                        property:null,
                    },
                    modal_reasigment: {
                        ...prev_State.modal_reasigment,
                        reservation_services:[],
                        reasigment:false
                    },
                    asigment:false,
                };
            },()=>{
                this.refreshList();
        });
    }

    handleOperationFilter = (params) => {
        var url = `${ApiOperationsUrl}operation_report/?date=${this.state.date}&property=${this.state.params.property}&type=${params.type}&unit=${params.unit_check?params.unit:""}&hotels=${params.hotel_check?params.hotels.toString():""}`;
        window.open(url, "_blank");
        this.setState(function (prevState) {
            return {
                modal_filter:{
                    ...prevState.modal_filter,
                    open: false,
                    params:params
                }
            };
        });
	}

    handleEmailProviders = (params) => {
        axios.post(`${ApiUrl}operations/operation_report_send_email/`,{
            date:this.state.date,
            property:this.state.params.property,
            type:params.type,
            unit:params.unit_check?params.unit:"",
            hotels:params.hotel_check?params.hotels.toString():"",
            providers:params.providers.map((provider)=>provider.id),
        }).then(res=>{
            alert("Correo enviado");
            this.setState(function (prevState) {
                return {
                    modal_filter:{
                        ...prevState.modal_filter,
                        open: false,
                        params:params
                    }
                };
            });
        })
    }

    onChangeSelectReservationService() {
        let reservation_services = this.state.reservation_services.filter((rs)=>rs.selected)
        this.setState(
            (prev_State) =>{
                return {
                    modal_asigment: {
                        ...prev_State.modal_asigment,
                        reservation_services:reservation_services,
                        date:this.state.date,
                        unit:null,
                        unit_code:null,
                        is_private:null,
                        value:0,
                        property:this.state.params.property,
                    },
                };
        });
    }

    unset_unit_asignment(){
        let reservation_services = this.state.reservation_services.filter((rs)=>rs.selected)
        this.setState(
            (prev_State) =>{
                return {
                     modal_reasigment: {
                        ...prev_State.modal_reasigment,
                        reservation_services:reservation_services,
                        reasigment:false,
                    },
                };
        });
    }

    unset_unit_asignment_all(){
        if(window.confirm(`¿Desea reasignar todas las unidades de la operación ${moment(this.state.date).format('DD/MM/YYYY')}?`)){
            let reservation_services = this.state.reservation_services.map((reservation_service)=>reservation_service.id)
            axios.put(`${ApiOperationsUrl}operations_unset_unit_asignment/`,
                {
                    reasigment:true,
                    reservation_services:reservation_services
                }
            ).then(res => {
                this.refreshList();
            });
        }
    }

    unset_unit_all(){
        if(window.confirm(`¿Desea desasignar todas las unidades de la operación ${moment(this.state.date).format('DD/MM/YYYY')}?`)){
            let reservation_services = this.state.reservation_services.map((reservation_service)=>reservation_service.id)
            axios.put(`${ApiOperationsUrl}operations_unset_unit/`,
                {
                    reasigment:true,
                    reservation_services:reservation_services
                }
            ).then(res => {
                this.refreshList();
            });
        }
    }

    handlePropertyClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: false,
                },
            };
        });
	}

    handleSelectOperation = (operation) => {
        this.setState(function (prev_State) {
            return {
                date:operation.date,
                modal_operations: {
                    ...prev_State.modal_operations,
                    open: false,
                },
            };
        },()=>{
            this.refreshList();
        });
	}

    handleOpenModal = (e) => {
        this.setState(function (prev_State) {
            return {
                modal_operations: {
                    ...prev_State.modal_operations,
                    open: true,
                },
            };
        });
	}

    getUnitClass(element){
        if(this.state.asigment && element.selected){
            return {
                backgroundColor: "#2962ff",
                color:"white"
            };
        }
        if(element.unit !== null){
            const value = this.state.units_colors[element.unit % this.state.units_colors.length];
            let number = element.number > 0? 1/element.number : 1;
            return {
                backgroundColor: `rgb(${value.bg})`,
                color:value.text
            };
        }
        return {
            backgroundColor: `rgb(255,255,255)`,
            color:"black"
        };
    }

    handlePrintDocument = (e) => {
        this.setState(function (prev_State) {
            return {
                modal_filter:{
                    ...prev_State.modal_filter,
                    open: true
                }
            };
        });
	}

    render(){
        const { reservation_services, params, modal_operations, modal_properties, modal_asigment, modal_reasigment, date, asigment, modal_filter } = this.state;
        const trasfer_type = {
            DEPARTURES:'Salida',
            ARRIVALS:'Llegada',
            INTERHOTEL:'InterHotel',
        }
        const trasfer_type_label = {
            DEPARTURES:'S',
            ARRIVALS:'L',
            INTERHOTEL:'I',
        }
        return(
            <Row>
                <Col lg="4">
                    <FormGroup row>
                        <Label size='sm' sm={4}>
                            Fecha inicio
                        </Label>
                        <Col sm={8}>
                            <Input type='date'
                                name="start_date"
                                placeholder="Fecha inicio"
                                value={params.start_date}
                                onChange={this.onChangeValue}
                                />
                        </Col>
                    </FormGroup>
                </Col>
                <Col lg="4">
                    <FormGroup row>
                        <Label size='sm' sm={4}>
                            Fecha fin
                        </Label>
                        <Col sm={8}>
                            <Input type='date'
                                name="due_date"
                                placeholder="Fecha fin"
                                value={params.due_date}
                                onChange={this.onChangeValue}
                                />
                        </Col>
                    </FormGroup>
                </Col>
                <Col lg="4">
                    <ButtonGroup>
                        <Button size='sm'
                            color='primary'
                            disabled={params.start_date===""&&params.due_date===""}
                            onClick={(e)=> this.refreshOperations()}>
                            Buscar operaciones <i className="bi bi-search"></i>
                        </Button>
                        <Button size='sm'
                            color='success'
                            disabled={modal_operations.operations.length===0}
                            onClick={this.handleOpenModal}>
                            Ver operaciones <i className="bi bi-clipboard"></i>
                        </Button>
                    </ButtonGroup>
                </Col>
                {reservation_services.length > 0?<>
                <Col lg="4">
                    <h5 style={{marginTop:15}}>Operación del {moment(date).format('LL')}</h5>
                </Col>
                <Col lg="8" className='my-2'>
                    <ButtonGroup>
                        <Button color='primary'
                            id="TooltipReport"
                            onClick={this.handlePrintDocument}>
                            Reporte de operación <i className="bi bi-clipboard2-fill"></i>
                        </Button>
                        <Button color='secondary'
                            id="TooltipSelectReservations"
                            onClick={()=>{
                                this.setState({asigment: !asigment});
                            }}>
                            Asignación de unidades <i className="bi bi-bus-front"></i>  
                        </Button>
                        {asigment?<>
                            <Button className='text-black'
                                color='info'
                                id="TooltipAsigmentUnit"
                                onClick={()=>{
                                    this.onChangeSelectReservationService();
                                }}
                                disabled={reservation_services.find((rs)=>rs.selected)?false:true}>
                                <i className="bi bi-box-arrow-in-down"></i>  
                            </Button>
                            <UncontrolledTooltip
                                placement="bottom"
                                target="TooltipAsigmentUnit">
                                Asignar reservaciones
                            </UncontrolledTooltip>
                            <Button className='text-black'
                                color='info'
                                id="TooltipUnasigmentUnit"
                                onClick={()=>{
                                    this.unset_unit_asignment();
                                }}
                                disabled={reservation_services.find((rs)=>rs.selected)?false:true}>
                                <i className="bi bi-box-arrow-up"></i>  
                            </Button>
                            <UncontrolledTooltip
                                placement="top"
                                target="TooltipUnasigmentUnit">
                                Desasignar reservaciones de unidad
                            </UncontrolledTooltip>
                        </>
                        :<>
                        <Button color='warning'
                            id="TooltipReasigmentUnitAll"
                            onClick={()=>{
                                this.unset_unit_asignment_all()
                            }}>
                            <i className="bi bi-arrow-clockwise"></i>  
                        </Button>
                        <UncontrolledTooltip
                            placement="bottom"
                            target="TooltipReasigmentUnitAll">
                            Reasignación de unidades
                        </UncontrolledTooltip>
                        <Button color='danger'
                            id="TooltipUnasigmentUnitAll"
                            onClick={()=>{
                                this.unset_unit_all()
                            }}>
                            <i className="bi bi-arrow-down-square-fill"></i>  
                        </Button>
                        <UncontrolledTooltip
                            placement="right"
                            target="TooltipUnasigmentUnitAll">
                            Designación de unidades
                        </UncontrolledTooltip>
                        </>}
                    </ButtonGroup>
                </Col>
                <Col lg="12">
                    <div className='table-scroll'>       
                        <div className='table-wrap'>
                            <Table size='xs' className="no-wrap align-middle" responsive bordered id="dataTable">
                                <thead>
                                    <tr>
                                        {asigment?<th><i className="bi bi-check2-square"></i></th>:<></>}
                                        <th>Nombre</th>
                                        <th>Servicio</th>
                                        <th>PUP</th>
                                        <th>Pax</th>
                                        <th>Hotel</th>
                                        <th>Destino</th>
                                        <th>Unidad</th>
                                        <th>Totalpax</th>
                                        <th>Tipo OP</th>
                                        <th>Vuelo</th>
                                        <th>Hora</th>
                                        <th>Zona</th>
                                        <th>CveRes</th>
                                        <th>Ref Opera</th>
                                        <th>Comentarios/Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservation_services.map((reservation_service, index) => (
                                        <tr key={reservation_service.id} style={this.getUnitClass(reservation_service)}>
                                            {asigment?
                                                <td>
                                                    <Input type="checkbox"
                                                        name="selected"
                                                        style={{fontSize:"15px"}}
                                                        value={reservation_service.selected}
                                                        onChange={(event)=>{
                                                            var reservation_services = this.state.reservation_services;
                                                            reservation_services[index].selected = event.target.checked;
                                                            this.setState({
                                                                reservation_services:reservation_services
                                                            });
                                                        }}/>
                                                </td>
                                            :<></>}
                                            <td>{reservation_service.pax}</td>
                                            <td>{trasfer_type_label[reservation_service.transfer_type]}-{reservation_service.service_name}</td>
                                            <td>{reservation_service.pup?moment(reservation_service.pup, "HH:mm:ss").format('HH:mm'):""}</td>
                                            <td>{reservation_service.adults+"."+reservation_service.childs}</td>
                                            <td>{reservation_service.transfer_type==="DEPARTURES"||reservation_service.transfer_type==="INTERHOTEL"?reservation_service.origin_name:reservation_service.destination_name}</td>
                                            <td>{reservation_service.transfer_type==="INTERHOTEL"?reservation_service.destination_name:""}</td>
                                            <td>
                                                {reservation_service.unit!==null?reservation_service.unit_code+(reservation_service.number>0?"-"+reservation_service.number:""):""} 
                                            </td>
                                            <td>{reservation_service.pax_total>0?reservation_service.pax_total:""}</td>
                                            <td>{reservation_service.operation_type_name}</td>
                                            <td>{reservation_service.flight_code}</td>
                                            <td>{reservation_service.flight_time!==""?moment(reservation_service.flight_time, "HH:mm:ss").format('HH:mm'):""}</td>
                                            <td>{reservation_service.transfer_type==="DEPARTURES"?reservation_service.origin_zone:reservation_service.destination_zone}</td>
                                            <td>{reservation_service.reference.toString().padStart(6, '0')}</td>
                                            <td>{reservation_service.opera}</td>
                                            <td>
                                                <p className='max-lines'>{reservation_service.reservation_comments}</p>
                                            </td>
                                        </tr>
                                    ))} 
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </Col>
                </>
                :<></>}
                <ModalOperationDate handleClose={this.handleClose} handleSelectOperation={this.handleSelectOperation} data={modal_operations}/>
                <ModalPropertiesAsignment handleAsignment={this.handleAsignment} handleClose={this.handlePropertyClose} data={modal_properties} />
                <ModalOperationUnit handleAsignment={this.handleReservationServiceAsignment} handleClose={this.handleClose} data={modal_asigment} />
                <ModalOperationAsigment handleAsignment={this.handleReservationServiceAsignment} handleClose={this.handleClose} data={modal_reasigment} />
                <ModalOperationFilterReport handleClose={this.handleClose} handleSave={this.handleOperationFilter} handleEmailProviders={this.handleEmailProviders} data={modal_filter}/>
            </Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <OperationList {...props} history={history} />;
}