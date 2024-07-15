import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ModalReservationFilterSummary extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueRadioClear = this.onChangeValueRadioClear.bind(this);
        this.onChangeValueCheck = this.onChangeValueCheck.bind(this);
        this.onChangeValueCheckBox = this.onChangeValueCheckBox.bind(this);
        this.onChangeValueRadioType = this.onChangeValueRadioType.bind(this);
        this.onChangeValueRadioSort = this.onChangeValueRadioSort.bind(this);
        this.onChangeValueRadioFormat = this.onChangeValueRadioFormat.bind(this);
        this.onChangeValueRadioConfirm = this.onChangeValueRadioConfirm.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                start_date:"",
                due_date:"",
                filter_by_year:false,
                year:0,
                file:"pdf",
                type:"ARRIVALS",
                sort_by:"sales_type",
                filter_by_hotel:false,
                hotels:[],
                filter_by_sale_type:false,
                sale_types: [],
                print_total:false,
            },
            options_hotels: [],
            options_sale_types: [],
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

    onChangeValueCheckBox(event) {
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.target.name]:event.target.checked,
				},
			};
		},()=>{
            if(event.target.name==="filter_by_year")
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
                },
            };
        },()=>{
            this.reset(this.state);
        });
    }

    onChangeValueRadioSort(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    sort_by:event.target.value,
                },
            };
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
        if(prev_data.start_date !== new_data.start_date)
			return true
        if(prev_data.due_date !== new_data.due_date)
			return true
        if(prev_data.year !== new_data.year)
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
        let filter_by_year = data.filter_by_year!==undefined?data.filter_by_year:params.filter_by_year;
        let year = data.year!==undefined?data.year:params.year;
        if(!filter_by_year&&start_date!==""&&due_date!==""){
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
                                sale_types:[],
                                operation_types:[]
                            },
                            options_hotels: res.data.hotels,
                            options_sale_types: res.data.sale_types,
                            options_operation_types: res.data.operation_types,
                            open: open,
                            property: property,
                        };
                    }
                );
            });
        } else if(filter_by_year&&year!==0){
            axios.get(`${ApiOperationsUrl}operation_report_list_filters_by_year/?year=${year}&property=${this.state.property}&type=${params.type}`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                        return {
                            ...prev_State,
                            params:{
                                ...params,
                                year:year,
                                hotels:[],
                                sale_types:[],
                                operation_types:[]
                            },
                            options_hotels: res.data.hotels,
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
                            year:year,
                            hotels:[],
                            sale_types:[],
                            operation_types:[],
                        },
                        options_hotels: [],
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
        var url = `${ApiOperationsUrl}operation_report_summary/?`;
        if(this.state.params.filter_by_year){
            url = url + `year=${this.state.params.year}`;
        } else {
            url = url + `start_date=${this.state.params.start_date}&due_date=${this.state.params.due_date}`;
        }
        url = url + `&file=${this.state.params.file}&type=${this.state.params.type}&sort_by=${this.state.params.sort_by}&property=${this.state.property}&print_total=${this.state.params.print_total}`;
        if(this.state.params.filter_by_hotel)
            url = url + `&hotels=${this.state.params.hotels.toString()}`;
        if(this.state.params.filter_by_sale_type)
            url = url + `&sale_types=${this.state.params.sale_types.toString()}`;
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
		const { params, open, property, options_hotels, options_sale_types, options_operation_types, modal_properties } = this.state;
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}>
				<ModalHeader className="text-center">Filtros de listas</ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-form">
                        <Row>
                            <Col sm={8}>
                                <Row>
                                    <Col sm={6}>
                                        <FormGroup>
                                            <Label size='sm'>
                                                Fecha inicio
                                            </Label>
                                            <Input type='date'
                                                size={'sm'}
                                                name="start_date"
                                                placeholder="Fecha inicio"
                                                disabled={params.filter_by_year}
                                                required={!params.filter_by_year}
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
                                                size={'sm'}
                                                name="due_date"
                                                placeholder="Fecha fin"
                                                disabled={params.filter_by_year}
                                                required={!params.filter_by_year}
                                                value={params.due_date}
                                                onChange={this.onChangeValue}/>
                                        </FormGroup>
                                    </Col>
                                    <Col sm={6}>
                                        <FormGroup check inline>
                                            <Input type="checkbox"
                                                name="filter_by_year"
                                                onChange={this.onChangeValueCheckBox}
                                                checked={params.filter_by_year}/>
                                                {' '}
                                            <Label check size='sm' style={{fontSize:"13.44px"}}>
                                                Resumen Año
                                            </Label>
                                        </FormGroup>
                                    </Col>
                                    <Col sm={6}>
                                        <FormGroup>
                                            <Input type='number'
                                                name="year"
                                                placeholder="Año"
                                                size={'sm'}
                                                min={2019}
                                                max={2030}
                                                disabled={!params.filter_by_year}
                                                required={params.filter_by_year}
                                                value={params.year}
                                                onChange={this.onChangeValue}/>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Col>
                            <Col sm={4}>
                                <legend>
                                    <h5>Tipo de traslado</h5>
                                </legend>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioType}>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="type"
                                            value={'DEPARTURES'}
                                            checked={params.type=="DEPARTURES"}/>
                                        <Label check>
                                            Salidas
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check>
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
                            <Col sm={4}>
                                <FormGroup tag="fieldset"
                                    onChange={this.onChangeValueRadioSort}>
                                    <legend>
                                        <h5>Ver reporte de</h5>
                                    </legend>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="sort_by"
                                            value={'sales_type'}
                                            checked={params.sort_by=="sales_type"}/>
                                        <Label check>
                                            Tipo de venta
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check>
                                        <Input type="radio"
                                            name="sort_by"
                                            value={'hotel'}
                                            checked={params.sort_by=="hotel"}/>
                                        <Label check>
                                            Hotel
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
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
                                            disabled
                                            checked={params.file=="word"}/>
                                        <Label check>
                                            <i className="bi bi-file-earmark-word-fill"></i>
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={5}>
                                <FormGroup tag="fieldset">
                                    <legend>
                                        <h5>Filtrar reporte por</h5>
                                    </legend>
                                    <FormGroup check>
                                        <Input type="checkbox"
                                            name="filter_by_sale_type"
                                            onChange={this.onChangeValueCheckBox}
                                            checked={params.filter_by_sale_type}/>
                                            {' '}
                                        <Label check>
                                            Tipo de venta
                                        </Label>
                                    </FormGroup>
                                    <FormGroup check>
                                        <Input type="checkbox"
                                            name="filter_by_hotel"
                                            onChange={this.onChangeValueCheckBox}
                                            checked={params.filter_by_hotel}/>
                                            {' '}
                                        <Label check>
                                            Hotel
                                        </Label>
                                    </FormGroup>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <UncontrolledAccordion defaultOpen="1">
                                    {options_sale_types.length > 0?
                                    <AccordionItem>
                                        <AccordionHeader targetId="1">
                                            Tipos de ventas
                                        </AccordionHeader>
                                        <AccordionBody accordionId="1">
                                            <Row>
                                            {options_sale_types.map((option_sale_type, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="sale_types"
                                                            value={option_sale_type.id}
                                                            disabled={!params.filter_by_sale_type}
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
                                            Hoteles
                                        </AccordionHeader>
                                        <AccordionBody accordionId="2">
                                            <Row>
                                            {options_hotels.map((option_hotel, index)=>(
                                                <Col sm={6}>
                                                    <FormGroup check inline>
                                                        <Input type="checkbox"
                                                            name="hotels"
                                                            value={option_hotel.id}
                                                            disabled={!params.filter_by_hotel}
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
                                </UncontrolledAccordion>
                            </Col>
                            <Col sm={8}>
                                <FormGroup check inline>
                                    <Input type="checkbox"
                                        name="print_total"
                                        onChange={this.onChangeValueCheckBox}
                                        checked={params.print_total}/>
                                        {' '}
                                    <Label check>
                                        Imprimir totales en otra hoja
                                    </Label>
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
    return <ModalReservationFilterSummary {...props} history={history} />;
}