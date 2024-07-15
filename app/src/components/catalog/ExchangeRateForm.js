import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ExchangeRateForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                start_date: "",
                type: "SALE",
                usd_currency: 0.0,
                euro_currency: 0.0,
            },
            provider:null,
            modal:{
                title: "Tipo de cambio",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"VP",
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

    onSubmit(e){
        e.preventDefault();
        if((this.state.id===null || this.state.data.property===null) && this.state.provider===null){
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

    SaveModelForm(){;
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}general/exchangerates/${this.state.id}/`, this.state.data)
                .then(res => {
                    if(this.state.provider === null)
                        this.reset(res.data.id);
                    else{
                        res.data.provider=this.state.provider;
                        this.resetProvider(res.data);
                    }
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                        };
                    });
                }).catch(this.catchError);
        } else {
            axios.post(`${ApiUrl}general/exchangerates/`, this.state.data)
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
                    if(this.state.provider === null)
                        this.props.history('/catalogs/exchangerate/'+res.data.id)
                }).catch(this.catchError);
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

    catchError = (error) =>{
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
        } else if(error.response.data.hasOwnProperty('start_date') > -1){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.start_date,
                    },
                };
            });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
        let exchangerate = this.props.exchangerate?this.props.exchangerate:null;
        if(exchangerate === null)
            this.reset(id)
        else
            this.resetProvider(exchangerate)
	}

	componentDidUpdate(prevProps, prevState) {
        if (prevProps.exchangerate !== this.props.exchangerate) {
			this.resetProvider(this.props.exchangerate?this.props.exchangerate:null);
		} else if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    reset(id){
        if (id !== null){
            axios.get(`${ApiUrl}general/exchangerates/${id}/`)
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
                });
        } else {
            this.setState({
                id:null,
                data:{
                    start_date: "",
                    type: "SALE",
                    usd_currency: 0.0,
                    euro_currency: 0.0,
                    provider: null
                },
                modal_properties:{
                    type:'property',
                    isopen:false,
                    filter:"VP",
                    value:null
                },
            });
        }
    }

    resetProvider(exchangerate){
        this.setState({
            id:exchangerate.id?exchangerate.id:null,
            data:exchangerate,
            provider:exchangerate.provider
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
        if(this.state.provider === null)
            this.props.history('/catalogs/exchangerates');
        else if(this.props.handleSave)
            this.props.handleSave();
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
        this.props.history('/catalogs/exchangerate/');
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

    render(){
        const { data,modal,provider,modal_properties } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Fecha de inicio</Label>
                                <Input type="date" 
                                    name="start_date"
                                    placeholder="Fecha de inicio" 
                                    value={data.start_date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        {provider===null?
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Tipo</Label>
                                <Input type="select" 
                                    name="type"  
                                    placeholder="Tipo" 
                                    value={data.type}
                                    onChange={this.onChangeValue}>
                                        <option value={'SALE'}>Ventas</option>
                                        <option value={'COMISSION'}>Comisiones</option>
                                </Input>
                            </FormGroup>
                        </Col>:<></>}
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Tipo de cambio USD</Label>
                                <Input type="number" 
                                    name="usd_currency"  
                                    placeholder="Tipo de cambio USD" 
                                    value={data.usd_currency}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Tipo de cambio EURO</Label>
                                <Input type="number" 
                                    name="euro_currency"  
                                    placeholder="Tipo de cambio EURO" 
                                    value={data.euro_currency}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                {provider?<ModalAlert handleClose={this.handleClose} data={modal}  />:
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} handleCloseError={this.handleCloseError}  data={modal}  />}
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ExchangeRateForm {...props} params = {params} history={history} />;
}