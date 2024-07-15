import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input, FormGroup, Label } from "reactstrap";
import { ApiOperationsUrl, ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import { getProfile } from '../user/UserModel';
import ModalOperationDate from './ModalOperationDate';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
import ModalOperationUnit from './ModalOperationUnit';
class OperationListVP extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectReservationService = this.onChangeSelectReservationService.bind(this);
        this.state={
            sales:[],
            selected_all:false,
            asigment:false,
            params:{
                start_date: "",
                due_date: "",
            },
            date:"",
            availability_group:null,
            modal_operations:{
                operations:[],
                open:false
            },
            modal_properties:{
                type:'property',
                isopen:true,
                filter:"VP",
                value:null
            },
            modal_asigment:{
                sales:[],
                unit:"",
            },
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
        axios.get(`${ApiSalesUrl}operations_list/`,{
                params: this.state.params,
            }).then(res=>{
                let operations = res.data.sort((a,b)=>{
                    var dateA = new Date(a.date+"T"+a.time);
                    var dateB = new Date(b.date+"T"+b.time);
                    let compareDate = dateA - dateB;
                    if(compareDate === 0){
                        return a.service.availability_group_name.localeCompare(b.service.availability_group_name);
                    }
                    return compareDate;
                })
                this.setState({
                    sales:[],
                    modal_operations:{
                        operations:operations,
                        open:true
                    }
                });
            })
    };

    refreshList(){
        axios.get(`${ApiSalesUrl}operations_list_date/`,{
                params: {
                    date:this.state.date,
                    service:this.state.service.id,
                    property:this.state.params.property
                },
            }).then(res=>{
                let units = new Array
                let hotels = new Array
                for (const element of res.data.operation) {
                    if(element.unit!==""&&element.unit!==null){
                        let unit = units.find((unit)=>unit.id===element.unit)
                        if(unit!==undefined){
                            unit.pax_total += (element.adults + element.childs);
                            element.pax_total = unit.pax_total;
                        } else {
                            element.pax_total = element.adults + element.childs;
                            unit = {
                                id:element.unit,
                                pax_total:element.adults + element.childs,
                            };
                            units.push(unit);
                        }
                    } else {
                        element.pax_total = 0
                    }
                    element.selected = false;
                    if(hotels.find((hotel)=>hotel.id==element.hotel.id)===undefined){
                        hotels.push({
                            id:element.hotel.id,
                            name:element.hotel.name,
                        })
                    }
                }
                this.setState({
                    sales:res.data.operation,
                    selected_all:false,
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
                    sales:[],
                    unit:"",
                },
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
                        sales:[],
                        unit:"",
                    },
                    asigment:false,
                };
            },()=>{
                this.refreshList();
        });
    }

    onChangeSelectReservationService() {
        let sales = this.state.sales.filter((sale)=>sale.selected)
        this.setState(
            (prev_State) =>{
                return {
                    modal_asigment: {
                        ...prev_State.modal_asigment,
                        sales:sales,
                        unit:"",
                        property:this.state.params.property,
                    },
                };
        });
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
                time:operation.time,
                service:operation.service,
                modal_operations: {
                    ...prev_State.modal_operations,
                    open: false,
                },
            };
        },()=>{
            this.refreshList();
        });
	}

    onChangeSelectScheduleAllotment(data) {
        let schedule_allotments = this.state.schedule_allotments.filter((sa)=>sa.selected);
        axios.patch(`${ApiSalesUrl}allotment_list/`,{
            schedule_allotments:schedule_allotments.map((schedule_allotment)=>schedule_allotment.id),
            active:data,
        }).then(res=>{
            this.refreshAllotments();
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
        const { sales, params, modal_operations, modal_properties, modal_asigment, date, service, selected_all, asigment, modal_filter } = this.state;
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
                {sales.length > 0?<>
                <Col lg="4">
                    <h6 style={{marginTop:10}}>Operación VP del {moment(date).format('LL')} de la Excursion {service.name}</h6>
                </Col>
                <Col lg="8" className='my-2'>
                    <ButtonGroup>
                        <Button size='sm'
                            onClick={()=>{
                                this.setState({asigment: !asigment});
                            }}>
                            Asignación de unidades <i className="bi bi-bus-front"></i>  
                        </Button>
                        {asigment?
                            <Button className='text-black' size='sm'
                                color='info'
                                onClick={()=>{
                                    this.onChangeSelectReservationService();
                                }}
                                disabled={sales.find((rs)=>rs.selected)?false:true}>
                                Asignar reservaciones<i className="bi bi-box-arrow-in-down"></i>  
                            </Button>
                        :<></>}
                    </ButtonGroup>
                </Col>
                <Col lg="12">
                    <div className='table-scroll'>       
                        <div className='table-wrap'>
                            <Table size='xs' className="no-wrap align-middle" responsive bordered id="dataTable">
                                <thead>
                                    <tr>
                                        {asigment?<th><Input type="checkbox"
                                                name="selected"
                                                style={{fontSize:"15px"}}
                                                checked={selected_all}
                                                onChange={(event)=>{
                                                    let sales = this.state.sales.map((sale)=>Object.assign(sale,{selected:event.target.checked}));
                                                    this.setState({
                                                        sales:sales,
                                                        selected_all:event.target.checked
                                                    });
                                                }}/></th>:<></>}
                                        <th>Nombre</th>
                                        <th>Servicio</th>
                                        <th>PUP</th>
                                        <th>Pax</th>
                                        <th>Hotel</th>
                                        <th>Unidad</th>
                                        <th>Totalpax</th>
                                        <th>Cupon</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale, index) => (
                                        <tr key={sale.id} style={this.getUnitClass(sale)}>
                                            {asigment?
                                                <td>
                                                    <Input type="checkbox"
                                                        name="selected"
                                                        style={{fontSize:"15px"}}
                                                        checked={sale.selected}
                                                        onChange={(event)=>{
                                                            var sales = this.state.sales;
                                                            sales[index].selected = event.target.checked;
                                                            this.setState({
                                                                sales:sales
                                                            });
                                                        }}/>
                                                </td>
                                            :<></>}
                                            <td>{sale.name_pax}</td>
                                            <td>{sale.service_data.name}</td>
                                            <td>{sale.pup?moment(sale.pup.time, "HH:mm:ss").format('HH:mm'):moment(sale.time, "HH:mm:ss").format('HH:mm')}</td>
                                            <td>{sale.adults+"."+sale.childs}</td>
                                            <td>{sale.hotel_name}</td>
                                            <td>
                                                {sale.unit} 
                                            </td>
                                            <td>{sale.pax_total>0?sale.pax_total:""}</td>
                                            <td>{sale.status}{sale.sale_key.toString().padStart(8, '0')}</td>
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
            </Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <OperationListVP {...props} history={history} />;
}