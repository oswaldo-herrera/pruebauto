import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class DiscountForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                start_date: "",
                due_date: "",
                sale_type: null,
                conditional_content_type: null,
                conditional_object_id: null,
            },
            options_providers: [],
            options_services: [],
            options_client_types: [],
            options_sale_types: [],
            options_content_types: [],
            modal:{
                title: "Descuentos",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                filter:"VP",
                isopen:false,
                value:null
            },
            tabs:[]
        }
        
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.name]:value,
				},
			};
		});
        if(event.name=="conditional_content_type"){
            this.setState(function (prevState) {
                return {
                    data: {
                        ...prevState.data,
                        conditional_object_id:null
                    },
                };
            });
        }
    }

    onSubmit(e){
        e.preventDefault();
        if(this.state.id===null || this.state.data.property===null){
            this.setState(function (prev_State) {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: true,
                    },
                };
            });
        } else {
            this.SaveModelForm()
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

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    data:{
                        ...prev_State.data,
                        property:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}sales/discounts/${this.state.id}/`, this.state.data)
                .then(res => {
                    this.reset(res.data.id);
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                        };
                    });
                }).catch(this.catchDateError);
        } else {
            axios.post(`${ApiUrl}sales/discounts/`, this.state.data)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Guardado exitoso!",
                            },
                        };
                    });
                    this.props.history('/catalogs/discount/'+res.data.id)
                }).catch(this.catchDateError);
        }
    }

    catchDateError = (error) =>{
        if(error.response.status == 500){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: "Error interno de servidor: contacte al administrador del sistema para continuar",
                    },
                };
            });
        } else if(error.response.data.hasOwnProperty('due_date') > -1){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.due_date,
                    },
                };
            });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
		this.reset(id);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    reset(id){
        if (id !== null){
            axios.get(`${ApiUrl}sales/discounts/${id}/`)
            .then(res => {
                this.setState(function (prev_State) {
                    return {
                        id:id,
                        data:res.data,
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.data.property,
                        },
                    };
                });
                this.options_load();
            });
        } else {
            this.setState({
                id:null,
                data:{
                    start_date: "",
                    due_date: "",
                    sale_type: null,
                    conditional_content_type: null,
                    conditional_object_id: null,
                },
                modal_properties:{
                    type:'property',
                    filter:"VP",
                    isopen:false,
                    value:null
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/services_list/?limit=1000`)
        .then(res => {
            this.setState({
                options_services:res.data.results.map((service)=>{return {value:service.id,label:service.name}})
            });
        });
        axios.get(`${ApiUrl}general/saletypes/?limit=500&ordering=name`)
        .then(res => {
            this.setState({
                options_sale_types:res.data.results.map((service)=>{return {value:service.id,label:service.name}})
            });
        });
        axios.get(`${ApiUrl}sales/client_types/?limit=500`)
        .then(res => {
            this.setState({
                options_client_types:res.data.results.map((client_type)=>{return {value:client_type.id,label:client_type.name}})
            });
        });
        axios.get(`${ApiUrl}general/providers/?limit=500`)
        .then(res => {
            this.setState({
                options_providers:res.data.results.map((provider)=>{return {value:provider.id,label:provider.name}})
            });
        });
        axios.get(`${ApiUrl}sales/conditional_content_types/`)
        .then(res => {
            this.setState({
                options_content_types:res.data.map((content_type)=>{return {value:content_type.id,label:content_type.name,model:content_type.model}})
            });
        });
    }

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
        this.props.history('/catalogs/discounts');
	}

    handleCloseAddMore = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                id:null
            };
        });
        this.props.history('/catalogs/discount/')
	}

    handleCloseError = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
	}

    getOptionContentTypeModel = (content_type) =>{
        let value = null,
            options = this.state.options_content_types;
        value = options.find((option)=>option.value===content_type);
        value = value?value.model:null
        return value;
    }

    getOptionValue = (field,content_type_model) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "sale_type":
                options = this.state.options_sale_types;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "conditional_content_type":
                options = this.state.options_content_types;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "conditional_object_id":
                switch(content_type_model){
                    case "clienttype":
                        options = this.state.options_client_types;
                        value = options.find((option)=>option.value===this.state.data[field]);
                        break;
                    
                    case "service":
                        options = this.state.options_services;
                        value = options.find((option)=>option.value===this.state.data[field]);
                        break;
                    case "provider":
                        options = this.state.options_providers;
                        value = options.find((option)=>option.value===this.state.data[field]);
                        break;
                }
                break;
        }
        return value;
    }

    render(){
        const { data, modal, modal_properties, options_content_types, options_client_types, options_sale_types, options_services, options_providers, } = this.state;
        const content_type_model = this.getOptionContentTypeModel(this.state.data.conditional_content_type)
        const select_option_sale_type = this.getOptionValue("sale_type");
        const select_option_conditional_content_type = this.getOptionValue("conditional_content_type");
        const select_option_conditional_object_id = this.getOptionValue("conditional_object_id",content_type_model);
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Periodo de inicio</Label>
                                <Input type="date" 
                                    name="start_date"
                                    placeholder="Periodo de inicio" 
                                    value={data.start_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Periodo de fin</Label>
                                <Input type="date" 
                                    name="due_date"
                                    placeholder="Periodo de fin" 
                                    value={data.due_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Descuento</Label>
                                <Input type="number" 
                                    name="discount"
                                    max={100}
                                    min={0}
                                    placeholder="Descuento" 
                                    value={data.discount}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Tipo de venta</Label>
                                <Select
                                    options={options_sale_types}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="sale_type"
                                    value={select_option_sale_type}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Condicional</Label>
                                <Select
                                    options={options_content_types}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="conditional_content_type"
                                    value={select_option_conditional_content_type}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        {content_type_model==="clienttype"?
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Tipo de cliente</Label>
                                <Select
                                    options={options_client_types}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="conditional_object_id"
                                    value={select_option_conditional_object_id}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        :<></>}
                        {content_type_model==="provider"?
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Proveedor</Label>
                                <Select
                                    options={options_providers}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="conditional_object_id"
                                    value={select_option_conditional_object_id}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        :<></>}
                        {content_type_model==="service"?
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Servicio</Label>
                                <Select
                                    options={options_services}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="conditional_object_id"
                                    value={select_option_conditional_object_id}
                                    onChange={this.onChangeSelectValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        :<></>}
                    </Row>
                    <FormGroup className='border-top pt-3'>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} handleCloseError={this.handleCloseError} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <DiscountForm {...props} params = {params} history={history} />;
}