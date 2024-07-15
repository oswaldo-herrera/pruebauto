import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalReservationFilter extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeSelectValueName = this.onChangeSelectValueName.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                reservation_date_after:"",
                reservation_date_before:"",
                id:0,
                sale_type__name:"",
                pax:"",
                arrival_date_after:"",
                arrival_date_before:"",
                arrival_flight:"",
                arrival_service:"",
                arrival_hotel:"",
                departure_date_after:"",
                departure_date_before:"",
                departure_flight:"",
                departure_service:"",
                departure_hotel:"",
                email:"",
                user_extension__user__username:"",
            },
            options_hotels: [],
            options_sale_types: [],
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

    onChangeSelectValue(data, event) {
        let label = data?data.label:data;
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.data,
                    [event.name]:label,
				},
			};
		});
    }

    onChangeSelectValueName(data, event) {
        let label = data?data.label:data;
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.name+"__name"]:label,
				},
			};
		});
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
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
		}
	}

	reset(data){
        let params = data.params!==undefined?data.params:this.state.params;
        let open = data.open!==undefined?data.open:this.state.open;
        this.setState({
            params: params,
            open: open,
        });
        this.options_load();
	}

    options_load(){
        axios.get(`${ApiUrl}general/hotels/?limit=500`)
        .then(res => {
            this.setState({
                options_hotels:res.data.results.map((hotel)=>{return {value:hotel.id,label:hotel.name}})
            });
        });
        axios.get(`${ApiUrl}general/saletypes/?limit=500&ordering=name`)
        .then(res => {
            this.setState({
                options_sale_types:res.data.results.map((sale_type)=>{return {value:sale_type.id,label:sale_type.name,data:sale_type}})
            });
        });
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
        let params = this.state.params;
        params.limit = 100;
		if(this.props.handleSave)
			this.props.handleSave(this.state.params);
	}

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "sale_type__name":
                options = this.state.options_sale_types;
                break;
            default:
                options = this.state.options_hotels;
                break;

        }
        value = options.find((option)=>option.label===this.state.params[field]);
        return value;
    }

	render(){
		const { params, open, options_hotels, options_sale_types } = this.state;
        const select_option_arrival_hotel = this.getOptionValue("arrival_hotel");
        const select_option_departure_hotel = this.getOptionValue("departure_hotel");
        const select_option_sale_type = this.getOptionValue("sale_type__name");
        const customSelectStyles = {
            control: (base) => ({
                ...base,
                height: 30,
                minHeight: 30
            }),
            singleValue: (provided) => ({
                ...provided,
                height: '30px',
                padding: '0px'
            }),
            input: (provided, state) => ({
                ...provided,
                margin: '0px',
            }),
            indicatorSeparator: state => ({
                display: 'none',
            }),
            indicatorsContainer: (provided, state) => ({
                ...provided,
                height: '30px',
            }),
            clearIndicator: (provided, state) => ({
                ...provided,
                padding: '2px',
            }),
            dropdownIndicator: (provided, state) => ({
                ...provided,
                padding: '2px',
            }),
        };
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
				keyboard={false}>
				<ModalHeader><div className="text-center">Filtros de reservación</div></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-form">
                        <Row>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="reservation_date_after" size='sm'>Fecha de reservación</Label>
                                    <Input type="date"
                                        name="reservation_date_after"
                                        bsSize="sm"
                                        value={params.reservation_date_after}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="reservation_date_before" size='sm'>&emsp;</Label>
                                    <Input type="date"
                                        name="reservation_date_before"
                                        bsSize="sm"
                                        value={params.reservation_date_before}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Referencia#</Label>
                                    <Input type="number"
                                        bsSize="sm"
                                        min={0}
                                        name="id"
                                        value={params.id}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Tipo de venta</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_sale_types}
                                        isClearable
                                        isSearchable
                                        name="sale_type"
                                        value={select_option_sale_type}
                                        onChange={this.onChangeSelectValueName}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Pax</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="pax"
                                        value={params.pax}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label size='sm'>Reserva opera</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="opera_code"
                                        value={params.opera_code}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}></Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="arrival_date_after" size='sm'>Fecha de llegada</Label>
                                    <Input type="date"
                                        name="arrival_date_after"
                                        bsSize="sm"
                                        value={params.arrival_date_after}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="arrival_date_before" size='sm'>&emsp;</Label>
                                    <Input type="date"
                                        name="arrival_date_before"
                                        bsSize="sm"
                                        value={params.arrival_date_before}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Vuelo llegada</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="arrival_flight"
                                        value={params.arrival_flight}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Servicio llegada</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="arrival_service"
                                        value={params.arrival_service}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Hotel llegada</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_hotels}
                                        isClearable
                                        isSearchable
                                        placeholder="Hotel llegada"
                                        name="arrival_hotel"
                                        value={select_option_arrival_hotel}
                                        onChange={this.onChangeSelectValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}></Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="departure_date_after" size='sm'>Fecha de salida</Label>
                                    <Input type="date"
                                        name="departure_date_after"
                                        bsSize="sm"
                                        value={params.departure_date_after}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="departure_date_before" size='sm'>&emsp;</Label>
                                    <Input type="date"
                                        name="departure_date_before"
                                        bsSize="sm"
                                        value={params.departure_date_before}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>Vuelo salida</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="departure_flight"
                                        value={params.departure_flight}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Servicio salida</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="departure_service"
                                        value={params.departure_service}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Hotel salida</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_hotels}
                                        isClearable
                                        isSearchable
                                        placeholder="Hotel salida"
                                        name="departure_hotel"
                                        value={select_option_departure_hotel}
                                        onChange={this.onChangeSelectValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}></Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Correo</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="email"
                                        value={params.email}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Usuario</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="user_extension__user__username"
                                        value={params.user_extension__user__username}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
				</ModalBody>
				<ModalFooter>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='filter-form'>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalReservationFilter {...props} history={history} />;
}