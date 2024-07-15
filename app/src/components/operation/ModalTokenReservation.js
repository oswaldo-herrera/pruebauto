import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
import { getProfile } from '../user/UserModel';
class ModalTokenReservation extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                operation_type:null,
                property:null,
                sale_type:null,
                contact:null,
                is_opera_code:false,
                opera_code:"",
                opera_hotel:"HRCUN",
                email:"",
            },
            options_operation_types: [],
            options_properties: [],
            options_sale_types: [],
            options_contacts: [],
        }
        getProfile().then((result) =>{
            this.setState({
                options_properties:result.properties.filter((property)=>property.code.includes("OP")).map((property)=>{return {value:property.id,label:property.name}})
            });
        });
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
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.name]:value,
				},
			};
		},()=>{
            if(event.name==="property"){
                this.options_load()
            }
        });
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
                params: {
					...prevState.params,
                    [event.target.name]:event.target.checked,
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
	}

    options_load(){
        if(this.state.params.property !== null){
            axios.get(`${ApiUrl}general/operation_types/?limit=500&properties=${this.state.params.property}`)
            .then(res => {
                this.setState({
                    options_operation_types:res.data.results.map((operation_type)=>{return {value:operation_type.id,label:operation_type.name}})
                });
            });
            axios.get(`${ApiUrl}general/saletypes/?limit=500&property=${this.state.params.property}&ordering=name`)
            .then(res => {
                this.setState({
                    options_sale_types:res.data.results.map((service)=>{return {value:service.id,label:service.name}})
                });
            });
            axios.get(`${ApiOperationsUrl}contacts/?limit=500&properties=${this.state.params.property}`)
            .then(res => {
                this.setState({
                    options_contacts:res.data.results.map((contact)=>{return {value:contact.id,label:contact.name}})
                });
            });
        }
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
        let params = this.state.params;
        axios.post(`${ApiOperationsUrl}reservation_create_tokens/`, params)
        .then(res => {
            alert(res.data.message)
            this.setState(function (prev_State) {
                return {
                    params:{
                        operation_type:null,
                        property:null,
                        sale_type:null,
                        contact:null,
                        is_opera_code:false,
                        opera_code:"",
                        opera_hotel:"HRCUN",
                        email:"",
                    },   
                };
            });
            if(this.props.handleClose)
			    this.props.handleClose();
        }).catch(error => {
            alert(error.response.data.error)
        });
	}

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "contact":
                options = this.state.options_contacts;
                break;
            case "operation_type":
                options = this.state.options_operation_types;
                break;
            case "sale_type":
                options = this.state.options_sale_types;
                break;
            case "property":
                options = this.state.options_properties;
                break;
        }
        value = options.find((option)=>option.value===this.state.params[field]);
        return value;
    }

	render(){
		const { params, open, options_operation_types, options_properties, options_sale_types, options_contacts } = this.state;
        const select_option_operation_type = this.getOptionValue("operation_type");
        const select_option_sale_type = this.getOptionValue("sale_type");
        const select_option_property = this.getOptionValue("property");
        const select_option_contact = this.getOptionValue("contact");
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
				keyboard={false}>
				<ModalHeader><div className="text-center">Enviar reservación por correo</div></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="token-form">
                        <Row>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Propiedad</Label>
                                    <Select
                                        options={options_properties}
                                        isClearable
                                        isSearchable
                                        placeholder="Propiedad"
                                        name="property"
                                        value={select_option_property}
                                        onChange={this.onChangeSelectValue}
                                        required/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Tipo de operación</Label>
                                    <Select
                                        options={options_operation_types}
                                        isClearable
                                        isSearchable
                                        placeholder="Tipo de operación"
                                        name="operation_type"
                                        value={select_option_operation_type}
                                        onChange={this.onChangeSelectValue}
                                        isDisabled={this.state.params.property===null}
                                        required/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Tipo de venta</Label>
                                    <Select
                                        options={options_sale_types}
                                        isClearable
                                        isSearchable
                                        placeholder="Tipo de venta"
                                        name="sale_type"
                                        value={select_option_sale_type}
                                        onChange={this.onChangeSelectValue}
                                        isDisabled={params.property===null}
                                        required/>
                                </FormGroup>
                            </Col>
                            
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Contacto</Label>
                                    <Select
                                        options={options_contacts}
                                        isClearable
                                        isSearchable
                                        placeholder="Contacto"
                                        name="contact"
                                        value={select_option_contact}
                                        onChange={this.onChangeSelectValue}
                                        isDisabled={this.state.params.property===null}
                                        required/>
                                </FormGroup>
                            </Col>
                            <Col sm={4}>
                                <FormGroup switch className='mb-2'>
                                    <Input type="switch" 
                                        name="is_opera_code"
                                        checked={params.is_opera_code}
                                        onChange={this.onChangeSwitchValue}/>
                                    <Label check>¿Tiene clave opera?</Label>
                                </FormGroup>
                                {params.is_opera_code?
                                <FormGroup>
                                    <Input type="number"
                                        bsSize="sm"
                                        name="opera_code"
                                        value={params.opera_code}
                                        onChange={this.onChangeValue}
                                        required/>
                                </FormGroup>:<></>}
                            </Col>
                            {params.is_opera_code?
                            <Col sm={4}>
                                <FormGroup>
                                    <Label for="opera_hotel" size='sm'>Hotel</Label>
                                    <Input type="select"
                                        name="opera_hotel"
                                        bsSize="sm"
                                        placeholder="Hotel"
                                        value={params.opera_hotel}
                                        onChange={this.onChangeValue}
                                        required>
                                            <option value={'HRCUN'}>Hard Rock Hotel Cancun</option>
                                            <option value={'HRPCM'}>Hard Rock Hotel Riviera Maya</option>
                                            <option value={'HRPVR'}>Hard Rock Hotel Vallarta</option>
                                    </Input>
                                </FormGroup>
                            </Col>:<></>}
                            <Col sm={4}>
                                <FormGroup>
                                    <Label size='sm'>Correo</Label>
                                    <Input type="text"
                                        bsSize="sm"
                                        name="email"
                                        value={params.email}
                                        onChange={this.onChangeValue}
                                        required/>
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
						<Button color="success" type="submit" form='token-form'>
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
    return <ModalTokenReservation {...props} history={history} />;
}