import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class SaleTypeForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeMultiSelectValue = this.onChangeMultiSelectValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                name: "",
                is_inner_bussiness: false,
                sap_code: "",
                warehouse_code: "",
                department_cecos: null,
                is_service_fee: false,
                is_sale_online: false,
                payment_methods:[],
            },
            options_departments: [],
            options_optypes: [],
            options_payment_methods: [],
            modal:{
                title: "Tipo de venta",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                value:null
            },
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
            axios.put(`${ApiUrl}general/saletypes/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}general/saletypes/`, this.state.data)
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
                    this.props.history('/catalogs/saletype/'+res.data.id)
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
        } else if(error.response.data.hasOwnProperty('error')){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.error,
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
            axios.get(`${ApiUrl}general/saletypes/${id}/`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
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
                    name: "",
                    is_inner_bussiness: false,
                    sap_code: "",
                    warehouse_code: "",
                    department_cecos: null,
                    is_service_fee: false,
                    payment_methods:[],
                },
                modal_properties:{
                    type:'property',
                    isopen:false,
                    value:null
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/departmentscecos/?limit=500`)
        .then(res => {
            this.setState({
                options_departments:res.data.results.map((department_cecos)=>{return {value:department_cecos.id,label:department_cecos.code.toString().padStart(9, '0') + " - " + department_cecos.name}})
            });
        });
        axios.get(`${ApiUrl}general/operation_types/?limit=500`)
        .then(res => {
            this.setState({
                options_optypes:res.data.results.map((operation_type)=>{return {value:operation_type.id,label:operation_type.name}})
            });
        });
        axios.get(`${ApiSalesUrl}payment_methods/?limit=500`)
        .then(res => {
            this.setState({
                options_payment_methods:res.data.results.map((payment_method)=>{return {value:payment_method.id,label:payment_method.name + " - " + payment_method.property_name ,data:payment_method}})
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
        this.props.history('/catalogs/saletypes');
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
        this.props.history('/catalogs/saletype/')
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

    onChangeMultiSelectValue(data) {
        let value = data?data.map((option)=>option.value):[];
        this.setState(function (prevState) {
            return {
                data: {
                    ...prevState.data,
                    payment_methods:value,
                },
            };
        });
    }

    getOptionValue = (field) =>{
        let options = field=="department_cecos"?this.state.options_departments:this.state.options_optypes;
        let value = options.find((option)=>option.value===this.state.data[field]);
        return value?value:null;
    }

    getMultipleOptionValue(){
        let value = this.state.options_payment_methods.filter((option)=>this.state.data.payment_methods.includes(option.value));
        return value;
    }

    render(){
        const { id,data,modal,modal_properties,options_departments,options_optypes,options_payment_methods } = this.state;
        const select_option_department_cecos = this.getOptionValue("department_cecos");
        const select_option_operation_type = this.getOptionValue("operation_type");
        const select_option_payment_methods = this.getMultipleOptionValue();
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Nombre</Label>
                                <Input type="text" 
                                    name="name"
                                    placeholder="Nombre" 
                                    value={data.name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Código SAP</Label>
                                <Input type="text" 
                                    name="sap_code"  
                                    placeholder="Código SAP" 
                                    value={data.sap_code}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Departamento CECOS</Label>
                                <Select
                                    options={options_departments}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="department_cecos"
                                    value={select_option_department_cecos}
                                    onChange={this.onChangeSelectValue}
                                    required={data.is_inner_bussiness}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="is_inner_bussiness"
                                    checked={data.is_inner_bussiness}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Es interdepartamental?</Label>
                            </FormGroup>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="is_service_fee"
                                    checked={data.is_service_fee}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>Service Fee</Label>
                            </FormGroup>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="is_sale_online"
                                    checked={data.is_sale_online}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Se usa en portal de ventas?</Label>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Tipo de operación</Label>
                                <Select
                                    options={options_optypes}
                                    isClearable={true}
                                    isSearchable={true}
                                    name="operation_type"
                                    value={select_option_operation_type}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Almacen</Label>
                                <Input type="text" 
                                    name="warehouse_code"  
                                    placeholder="Código Almacen" 
                                    value={data.warehouse_code}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={9}>
                            <FormGroup>
                                <Label for="payment_methods">Metodos de pago autorizados</Label>
                                <Select
                                    isMulti
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    options={options_payment_methods}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Metodos de pago"}
                                    name="payment_methods"
                                    value={select_option_payment_methods}
                                    onChange={this.onChangeMultiSelectValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <SaleTypeForm {...props} params = {params} history={history} />;
}