import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ServiceRateComissionList from './ServiceRateComissionList';
class ServiceRateForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                start_date: "",
                due_date: "",
                service:null,
                currency:"MN",
                adult_price: 0.0,
                child_price: 0.0,
                hard_rock_comission_adult: 0.0,
                hard_rock_comission_child: 0.0,
                tax:16,
                exent_import_adult:0.0,
                exent_import_child:0.0
            },
            modal:{
                title: "Tarifa",
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

    onSubmit(e){
        e.preventDefault();
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}sales/service_rates/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}sales/service_rates/`, this.state.data)
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
        let id = this.props.id?this.props.id:null;
        let service = this.props.service?this.props.service:null;
        this.reset(id);
        if (service){
            this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        service:service,
                    },
                };
            });
        }
        
	}

	componentDidUpdate(prevProps, prevState) {
        if(this.props.id !== this.state.id){
			this.reset(this.props.id);
		}
        if (this.props.service !== this.state.data.service) {
			this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        service:this.props.service,
                    },
                };
            });
		}
	}

    reset(id){
        if(id !== null){
            axios.get(`${ApiUrl}sales/service_rates/${id}/`)
            .then(res => {
                this.setState({
                    id:id,
                    data:res.data,
                });
            });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:id,
                    data: {
                        ...prev_State.data,
                        start_date: "",
                        due_date: "",
                        currency:"MN",
                        adult_price: 0.0,
                        child_price: 0.0,
                        hard_rock_comission_adult: 0.0,
                        hard_rock_comission_child: 0.0,
                        tax:16,
                        exent_import_adult:0.0,
                        exent_import_child:0.0
                    },
                };
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

    render(){
        const { id,data,modal } = this.state;
        const adult_fee = data.adult_price-(data.adult_price*(data.hard_rock_comission_adult/100));
        const child_fee = data.child_price-(data.child_price*(data.hard_rock_comission_child/100));
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}></Col>
                        <Col >
                            <Row>
                                <Col sm={4}>
                                    <FormGroup>
                                        <Label>Moneda</Label>
                                        <Input type="select" 
                                            name="currency"  
                                            placeholder="Moneda" 
                                            value={data.currency}
                                            onChange={this.onChangeValue}>
                                                <option value={'MN'}>M.N.</option>
                                                <option value={'USD'}>USD</option>
                                                <option value={'EURO'}>EURO</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col sm={4}>
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
                                <Col sm={4}>
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
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Precio adulto</Label>
                                        <Input type="number" 
                                            name="adult_price"  
                                            placeholder="Precio adulto" 
                                            value={data.adult_price}
                                            onChange={this.onChangeValue}
                                            min={0}
                                            step={0.01}
                                            required/>
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Tarifa adulto</Label>
                                        <Input type="number" 
                                            name="adult_fee"  
                                            placeholder="Tarifa adulto" 
                                            value={adult_fee}
                                            disabled/>
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Comisión Hard Rock Adulto</Label>
                                        <Input type="number" 
                                            name="hard_rock_comission_adult"  
                                            placeholder="Comisión Hard Rock" 
                                            value={data.hard_rock_comission_adult}
                                            step={0.01}
                                            onChange={this.onChangeValue}
                                            />
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Importe exento Adulto</Label>
                                        <Input type="number" 
                                            name="exent_import_adult"  
                                            placeholder="Importe exento Adulto" 
                                            value={data.exent_import_adult}
                                            min={0}
                                            step={0.01}
                                            onChange={this.onChangeValue} />
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Precio menor</Label>
                                        <Input type="number" 
                                            name="child_price"  
                                            placeholder="Precio menor" 
                                            value={data.child_price}
                                            min={0}
                                            step={0.01}
                                            onChange={this.onChangeValue}
                                            />
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Tarifa menor</Label>
                                        <Input type="number" 
                                            name="child_fee"  
                                            placeholder="Tarifa menor" 
                                            value={child_fee}
                                            disabled/>
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Comisión Hard Rock Menor</Label>
                                        <Input type="number" 
                                            name="hard_rock_comission_child"  
                                            placeholder="Comisión Hard Rock" 
                                            value={data.hard_rock_comission_child}
                                            step={0.01}
                                            onChange={this.onChangeValue}
                                            />
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>Importe exento menor</Label>
                                        <Input type="number" 
                                            name="exent_import_child"  
                                            placeholder="Importe exento menor" 
                                            value={data.exent_import_child}
                                            min={0}
                                            step={0.01}
                                            onChange={this.onChangeValue} />
                                    </FormGroup>
                                </Col>
                                <Col sm={6}>
                                    <FormGroup>
                                        <Label>IVA</Label>
                                        <Input type="number" 
                                            name="tax"  
                                            placeholder="IVA" 
                                            value={data.tax}
                                            min={0}
                                            onChange={this.onChangeValue} />
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Col>
                        <Col sm={3}></Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalAlert handleClose={this.handleClose} handleCloseError={this.handleCloseError} data={modal}  />
                {id?<ServiceRateComissionList service_rate={id} />:<></>}
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ServiceRateForm {...props} params = {params} history={history} />;
}