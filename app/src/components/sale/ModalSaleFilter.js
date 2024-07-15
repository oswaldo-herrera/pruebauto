import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalSaleFilter extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                sale_date_after:"",
                sale_date_before:"",
                status:"",
                sale_key:"",
                sale_key_manual:"",
                sale_type__name:"",
                name_pax:"",
                service_date_after:"",
                service_date_before:"",
                service__name:"",
                hotel__name:"",
                representative__name:"",
                email:"",
                user_extension__user__username:"",
            },
            options_hotels: [],
            options_sale_types: [],
            options_services: [],
            options_representatives: [],
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
        },()=>{this.options_load()});
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
        axios.get(`${ApiUrl}general/representatives/?limit=500&active=true`)
        .then(res => {
            this.setState({
                options_representatives:res.data.results.map((representative)=>{return {value:representative.id,label:representative.name}})
            });
        });
        axios.get(`${ApiUrl}general/services/?limit=750`)
        .then(res => {
            this.setState({
                options_services:res.data.results.map((service)=>{return {value:service.id,label:service.name}})
            });
        });
    }

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "service__name":
                options = this.state.options_services;
                break;
            case "sale_type__name":
                options = this.state.options_sale_types;
                break;
            case "representative__name":
                options = this.state.options_representatives;
                break;
            default:
                options = this.state.options_hotels;
                break;

        }
        value = options.find((option)=>option.label===this.state.params[field]);
        return value;
    }


    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
		if(this.props.handleSave)
			this.props.handleSave(this.state.params);
	}

	render(){
		const { params, open, options_sale_types, options_hotels, options_representatives, options_services } = this.state;
        const select_option_representative = this.getOptionValue("representative__name");
        const select_option_sale_type = this.getOptionValue("sale_type__name");
        const select_option_service = this.getOptionValue("service__name");
        const select_option_hotel = this.getOptionValue("hotel__name");
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
				<ModalHeader><div className="text-center">Filtros de venta</div></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-form">
                        <Row>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="sale_date_after" size='sm'>Fecha de venta</Label>
                                    <Input type="date"
                                        name="sale_date_after"
                                        bsSize="sm"
                                        value={params.sale_date_after}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="sale_date_before" size='sm'>&emsp;</Label>
                                    <Input type="date"
                                        name="sale_date_before"
                                        bsSize="sm"
                                        value={params.sale_date_before}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={2}>
                                <FormGroup>
                                    <Label size='sm'>#Cupon</Label>
                                    <Input type="number"
                                        bsSize="sm"
                                        name="sale_key"
                                        value={params.sale_key}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label size='sm'>Cupon manual</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="sale_key_manual"
                                        value={params.sale_key_manual}
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
                                        onChange={this.onChangeSelectValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Pax</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="name_pax"
                                        value={params.name_pax}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
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
                                    <Label size='sm'>Hotel</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_hotels}
                                        isClearable
                                        isSearchable
                                        name="hotel"
                                        value={select_option_hotel}
                                        onChange={this.onChangeSelectValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="service_date_after" size='sm'>Fecha de servicio</Label>
                                    <Input type="date"
                                        name="service_date_after"
                                        bsSize="sm"
                                        value={params.service_date_after}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="service_date_before" size='sm'>&emsp;</Label>
                                    <Input type="date"
                                        name="service_date_before"
                                        bsSize="sm"
                                        value={params.service_date_before}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={6}>
                                <FormGroup>
                                    <Label size='sm'>Servicio</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_services}
                                        isClearable
                                        isSearchable
                                        name="service"
                                        value={select_option_service}
                                        onChange={this.onChangeSelectValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Representante</Label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={options_representatives}
                                        isClearable
                                        isSearchable
                                        name="representative"
                                        value={select_option_representative}
                                        onChange={this.onChangeSelectValue}/>
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
                            <Col sm={3}>
                                <FormGroup>
                                    <Label for="status" size='sm'>Estado de venta</Label>
                                    <Input type="select"
                                        name="status"
                                        bsSize="sm"
                                        placeholder="Tipo de veta"
                                        value={params.status}
                                        onChange={this.onChangeValue}>
                                            <option value={''}>Todas</option>
                                            <option value={'A'}>Venta (A)</option>
                                            <option value={'R'}>Reembolso (R)</option>
                                            <option value={'B'}>Bloqueo (B)</option>
                                            <option value={'C'}>Cancelado (C)</option>
                                    </Input>
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
    return <ModalSaleFilter {...props} history={history} />;
}