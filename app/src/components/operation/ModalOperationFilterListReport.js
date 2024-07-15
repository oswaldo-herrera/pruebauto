import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ModalReservationFilterListReport extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueRadioClear = this.onChangeValueRadioClear.bind(this);
        this.onChangeValueCheck = this.onChangeValueCheck.bind(this);
        this.onChangeValueRadioType = this.onChangeValueRadioType.bind(this);
        this.onChangeValueRadioFormat = this.onChangeValueRadioFormat.bind(this);
        this.onChangeValueRadioConfirm = this.onChangeValueRadioConfirm.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                start_date:"",
                due_date:"",
                file:"pdf",
                type:"ARRIVALS",
                reservation_confirm:"CONF",
                hotels:[],
                services:[],
                sale_types: [],
                operation_types: [],
            },
            options_hotels: [],
            options_services: [],
            options_sale_types: [],
            options_operation_types: [],
            property:null,
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"OP",
                value:null
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
		},()=>{
            this.reset(this.state);
        }); 
    }

    onChangeValueCheck(event) {
        let values = this.state.params[event.target.name];
        if(event.target.checked){
            values.push(event.target.value)
        } else {
            const index = values.indexOf(event.target.value);
            if (index > -1) { // only splice array when item is found
                values.splice(index, 1); // 2nd parameter means remove one item only
            }
        }
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:values,
                },
            };
        });
    }

    onChangeValueRadioClear(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    [event.target.name]:[],
                },
            };
        });
    }

    onChangeValueRadioConfirm(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    reservation_confirm:event.target.value,
                },
            };
        });
    }

    onChangeValueRadioFormat(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    file:event.target.value,
                },
            };
        });
    }

    onChangeValueRadioType(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    type:event.target.value,
                    reservation_confirm:"CONF",
                },
            };
        },()=>{
            this.reset(this.state);
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
        if(prev_data.start_date !== new_data.start_date)
			return true
        if(prev_data.due_date !== new_data.due_date)
			return true
        if(prev_data.open !== new_data.open)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)) {
			this.reset(this.props.data);
            if(prevProps.data.open !== this.props.data.open && this.props.data.open === true){
                this.setState(
                    (prev_State) =>{
                        return {
                            ...prev_State,
                            modal_properties:{
                                ...prev_State.modal_properties,
                                isopen:true,
                            },
                        };
                    }
                );
            }
		}
	}

	reset(data){
        let params = data.params!==undefined?data.params:this.state.params;
        let open = data.open!==undefined?data.open:this.state.open;
        let property = data.property!==undefined?data.property:this.state.property;
        let start_date = data.start_date!==undefined?data.start_date:params.start_date;
        let due_date = data.due_date!==undefined?data.due_date:params.due_date;
        if(start_date!==""&&due_date!==""){
            axios.get(`${ApiOperationsUrl}operation_report_list_filters/?start_date=${start_date}&due_date=${due_date}&property=${this.state.property}&type=${params.type}`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                        return {
                            ...prev_State,
                            params:{
                                ...params,
                                start_date:start_date,
                                due_date:due_date,
                                hotels:[],
                                services:[],
                                sale_types:[],
                                operation_types:[]
                            },
                            options_hotels: res.data.hotels,
                            options_services: res.data.services,
                            options_sale_types: res.data.sale_types,
                            options_operation_types: res.data.operation_types,
                            open: open,
                            property: property,
                        };
                    }
                );
            });
        } else {
            this.setState(
                (prev_State) =>{
                    return {
                        ...prev_State,
                        params:{
                            ...params,
                            start_date:start_date,
                            due_date:due_date,
                            hotels:[],
                            services:[],
                            sale_types:[],
                            operation_types:[],
                        },
                        options_hotels: [],
                        options_services: [],
                        options_sale_types: [],
                        options_operation_types: [],
                        open: open,
                        property: property,
                    };
                }
            );
        }
        
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}
    
    handleAsignment = (value) => {
        this.setState(
            (prev_State) => {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    property:value
                };
            }
        );
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

	onSubmit(e){
        e.preventDefault();
        var url = `${ApiOperationsUrl}operation_report_list/?start_date=${this.state.params.start_date}&due_date=${this.state.params.due_date}&file=${this.state.params.file}&type=${this.state.params.type}&reservation_confirm=${this.state.params.reservation_confirm}&property=${this.state.property}&hotels=${this.state.params.hotels.toString()}&sale_types=${this.state.params.sale_types.toString()}&operation_types=${this.state.params.operation_types.toString()}`;
        window.open(url, "_blank");
	}

    checkedMarkElement(selected,option){
        if(selected.length > 0){
            let value = selected.find((selecte)=>selecte===option.id+"")
            return value !== undefined;
        } else {
            return false;
        }
        
    }
    
	render(){
		const { params, open, property, options_hotels, options_services, options_sale_types, options_operation_types, modal_properties } = this.state;
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}>
				<ModalHeader className="text-center">Filtros de listas</ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-form">
                        <Row>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Fecha inicio
                                    </Label>
                                    <Input type='date'
                                        name="start_date"
                                        placeholder="Fecha inicio"
                                        required
                                        value={params.start_date}
                                        onChange={this.onChangeValue}
                                        />
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Fecha fin
                                    </Label>
                                    <Input type='date'
                                        name="due_date"
                                        placeholder="Fecha fin"
                                        required
                                        value={params.due_date}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioType}>
                                    <legend>
                                        <h5>Tipo de traslado</h5>
                                    </legend>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'ALL'}
                                            checked={params.type=="ALL"}/>
                                        <Label check>
                                            Todas
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'INTERHOTEL'}
                                            checked={params.type=="INTERHOTEL"}/>
                                        <Label check>
                                            Interhotel
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'DEPARTURES'}
                                            checked={params.type=="DEPARTURES"}/>
                                        <Label check>
                                            Salidas
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="type"
                                            value={'ARRIVALS'}
                                            checked={params.type=="ARRIVALS"}/>
                                        <Label check>
                                            Llegadas
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioFormat}>
                                    <legend>
                                        <h5>Tipo de documento</h5>
                                    </legend>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'pdf'}
                                            checked={params.file=="pdf"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-pdf-fill"></i>
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'excel'}
                                            checked={params.file=="excel"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-excel-fill"></i>
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="file"
                                            value={'word'}
                                            checked={params.file=="word"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-word-fill"></i>
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <UncontrolledAccordion defaultOpen="1">
                                    {options_sale_types.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="1">
                                            Tipos de ventas&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="sale_types"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.sale_types.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="sale_types"
                                                    disabled
                                                    checked={params.sale_types.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="1">
                                            <Row>
                                            {options_sale_types.map((option_sale_type, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="sale_types"
                                                            value={option_sale_type.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.sale_types,option_sale_type)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_sale_type.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_hotels.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="2">
                                            Hotel&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="hotels"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.hotels.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="hotels"
                                                    disabled
                                                    checked={params.hotels.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="2">
                                            <Row>
                                            {options_hotels.map((option_hotel, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="hotels"
                                                            value={option_hotel.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.hotels,option_hotel)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_hotel.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_operation_types.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="3">
                                            Tipo de operación&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="operation_types"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.operation_types.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="operation_types"
                                                    disabled
                                                    checked={params.operation_types.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="3">
                                            <Row>
                                            {options_operation_types.map((option_operation_type, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="operation_types"
                                                            value={option_operation_type.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.operation_types,option_operation_type)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_operation_type.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                    {options_services.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="4">
                                            Servicio&nbsp;
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="services"
                                                    onChange={this.onChangeValueRadioClear}
                                                    checked={params.services.length==0}/>
                                                <Label check className='mt-1'>
                                                    Todos
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check inline>
                                                <Input type="radio"
                                                    name="services"
                                                    disabled
                                                    checked={params.services.length>0}/>
                                                <Label check className='mt-1'>
                                                    Algunos
                                                </Label>
                                            </FormGroup>
                                        </AccordionHeader>
                                        <AccordionBody accordionId="4">
                                            <Row>
                                            {options_services.map((option_service, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="services"
                                                            value={option_service.id}
                                                            onChange={this.onChangeValueCheck}
                                                            checked={this.checkedMarkElement(params.services,option_service)}/>
                                                            {' '}
                                                        <Label check>
                                                            {option_service.name}
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            ))}
                                            </Row>
                                        </AccordionBody>
                                    </AccordionItem>
                                    :<></>}
                                </UncontrolledAccordion>
                            </Col>
                            <Col sm={12} className='mt-2'>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioConfirm}>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="confirm"
                                            value={'CONF'}
                                            checked={params.reservation_confirm=="CONF"}/>
                                        <Label check>
                                            Confirmadas
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check inline>
                                        <Input type="radio"
                                            name="confirm"
                                            value={'NO CONF'}
                                            checked={params.reservation_confirm=="NO CONF"}/>
                                        <Label check>
                                            Sin Confirmar
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
				</ModalBody>
				<ModalFooter>
                    {open?
                    <ModalPropertiesAsignment handleAsignment={this.handleAsignment} handleClose={this.handlePropertyClose} data={modal_properties} />
                    :<></>}
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='filter-form' disabled={property===null}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
        </>)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalReservationFilterListReport {...props} history={history} />;
}