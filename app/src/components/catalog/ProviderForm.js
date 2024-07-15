import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import ExchangeRateList from '../catalog/ExchangeRateList';
import ExchangeRateForm from '../catalog/ExchangeRateForm';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ProviderForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.handleExchangeRateCreate = this.handleExchangeRateCreate.bind(this);
        this.handleExchangeRateEdit = this.handleExchangeRateEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                name: "",
                business_name: "",
                tax_key: "",
                address: "",
                city: "",
                phone: "",
                currency: "MN",
                sap_code: "",
                email: "",
                url: "",
                credit_days: 0,
                active: true,
            },
            modal:{
                title: "Proveedor",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'properties',
                isopenonproperties:true,
                isopen:false,
                value:[]
            },
            search:"",
            exchangerate:null
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
                    active:event.target.checked,
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: true,
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
                        properties:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}general/providers/${this.state.id}/`, this.state.data)
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
                });
        } else {
            axios.post(`${ApiUrl}general/providers/`, this.state.data)
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
                    this.props.history('/catalogs/provider/'+res.data.id)
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
            axios.get(`${ApiUrl}general/providers/${id}/`)
                .then(res => {
                    this.setState(
                        (prev_State) =>{
                        return {
                            id:id,
                            data:res.data,
                            modal_properties: {
                                ...prev_State.modal_properties,
                                value:res.data.properties,
                                properties_data:res.data.properties_data,
                            },
                        };
                    });
                });
        } else {
            this.setState({
                id:null,
                data:{
                    name: "",
                    business_name: "",
                    tax_key: "",
                    address: "",
                    city: "",
                    phone: "",
                    currency: "MN",
                    sap_code: "",
                    email: "",
                    url: "",
                    credit_days: 0,
                    active: true,
                },
                modal_properties:{
                    type:'properties',
                    isopenonproperties:true,
                    isopen:false,
                    value:[]
                },
            });
        }
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
        this.props.history('/catalogs/provider/')
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

    onChangeSearch(e) {
		this.setState({
			search: e.target.value,
		});
	};

    handleExchangeRateCreate = () => {
        this.setState({
            exchangerate:{
                start_date: "",
                usd_currency: 0.0,
                euro_currency: 0.0,
                provider:this.state.id,
                property:null
            },
        });
	}

    handleExchangeRateEdit = (id) => {
        axios.get(`${ApiUrl}general/exchangerates/${id}/`)
        .then(res => {
            this.setState({
                exchangerate:res.data,
            });
        });
	}
   
    handleSave = () => {
        this.setState({
            exchangerate:null,
            search:this.state.search===""?" ":""
        });
	}

    render(){
        const { id,data,modal,modal_properties,exchangerate,search } = this.state;
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
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Nombre Comercial</Label>
                                <Input type="text" 
                                    name="business_name"  
                                    placeholder="Nombre Comercial" 
                                    value={data.business_name}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>RFC</Label>
                                <Input type="text"
                                    size={13}
                                    maxLength={13}
                                    name="tax_key"  
                                    placeholder="RFC" 
                                    value={data.tax_key}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Ciudad/Estado</Label>
                                <Input type="text" 
                                    name="city"  
                                    placeholder="Ciudad/Estado" 
                                    value={data.city}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Telefono</Label>
                                <Input type="number"
                                    size={10}
                                    maxLength={10}
                                    name="phone"  
                                    placeholder="Telefono" 
                                    value={data.phone}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Moneda</Label>
                                <Input type="select" 
                                    name="currency"  
                                    placeholder="Moneda" 
                                    value={data.currency}
                                    onChange={this.onChangeValue}>
                                        <option value={'MN'}>M.N.</option>
                                        <option value={'USD'}>USD</option>
                                </Input>
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
                        <Col sm={4}>
                            <FormGroup>
                                <Label>Correo</Label>
                                <Input type="email" 
                                    name="email"  
                                    placeholder="Correo" 
                                    value={data.email}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup>
                                <Label>URL</Label>
                                <Input type="url" 
                                    name="url"  
                                    placeholder="URL" 
                                    value={data.url}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Dias de crédito</Label>
                                <Input type="number" 
                                    name="credit_days"  
                                    placeholder="Dias de crédito" 
                                    value={data.credit_days}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="active"
                                    checked={data.active}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>Activo</Label>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Dirección</Label>
                                <Input type="textarea" 
                                    name="address"  
                                    placeholder="Dirección" 
                                    value={data.address}
                                    onChange={this.onChangeValue}/>
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
                {id?
                <Row className='pt-4 border-top'>
                    <Col lg="3"><h4>Tipo de cambio</h4></Col>
                    <Col lg="2">
                        <Button className="btn" color="primary" size="sm" block onClick={this.handleExchangeRateCreate}>
                            <h5 className='mb-0'><i className="bi bi-plus"></i></h5>
                        </Button>
                    </Col>
                    <Col></Col>
                    <Col lg="4">
                        <Input
                            bsSize="sm"
                            name="search"
                            placeholder="Busqueda"
                            type="search"
                            value={search}
                            onChange={this.onChangeSearch.bind(this)}/>
                    </Col>
                    <Col lg="12">
                        <ExchangeRateList search={search} provider={{id:id,exchangerate:exchangerate}} handleExchangeRateEdit={this.handleExchangeRateEdit} />
                    </Col>
                    {exchangerate?
                    <Col lg="12" className='pt-3 border-top'>
                        <ExchangeRateForm exchangerate={exchangerate} handleSave={this.handleSave} />
                    </Col>
                    :<></>}
                </Row>
               :<></>}
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ProviderForm {...props} params = {params} history={history} />;
}