import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
class ServiceRateComissionForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                usd_currency: 0,
                payment_type: null,
                service_rate:null,
                comission: 0.0,
            },
            options: [],
            modal:{
                title: "Comisión de representante",
                type: 'success',
                message: null,
            }
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
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}sales/service_rate_comissions/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}sales/service_rate_comissions/`, this.state.data)
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
                });
        }
    }

    componentDidMount() {
        let id = this.props.id?this.props.id:null;
        let service_rate = this.props.service_rate?this.props.service_rate:null;
        this.reset(id);
        if (service_rate){
            this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        service_rate:service_rate,
                    },
                };
            });
        }
        
	}

	componentDidUpdate(prevProps, prevState) {
        if(this.props.id !== this.state.id){
			this.reset(this.props.id);
		}
        if (this.props.service_rate !== this.state.data.service_rate) {
			this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        service_rate:this.props.service_rate,
                    },
                };
            });
		}
	}

    reset(id){
        if(id !== null){
            axios.get(`${ApiUrl}sales/service_rate_comissions/${id}/`)
            .then(res => {
                this.setData(id,res.data);
            });
        } else {
            let data = {
                service_rate:this.state.service_rate,
                usd_currency: 0,
                payment_type: null,
                comission: 0.0,
            }
            this.setData(id,data);
        }
    }

    setData(id,data){
        axios.get(`${ApiUrl}sales/payment_types/?is_commissionable=true`).then(res => {
            this.setState({
                id:id,
                data:data,
                options:res.data.results.map((payment_type)=>{return {value:payment_type.id, label:payment_type.name}})
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
        if(this.props.handleSave)
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

    getOptionValue = (field) =>{
        let value = this.state.options.find((option)=>option.value===this.state.data[field]);
        return value?value:null;
    }

    render(){
        const { id,data,modal, options } = this.state;
        const select_option_payment_type = this.getOptionValue('payment_type');
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Tipo de forma de pago</Label>
                                <Select
                                    options={options}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Seleccione tipo de forma de pago"}
                                    name="payment_type"
                                    value={select_option_payment_type}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={6}>
                            <FormGroup>
                                <Label>Comisión</Label>
                                <Input type="number" 
                                    name="comission"  
                                    placeholder="Comisión" 
                                    value={data.comission}
                                    min={0}
                                    step={0.01}
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
                <ModalAlert handleClose={this.handleClose} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ServiceRateComissionForm {...props} params = {params} history={history} />;
}