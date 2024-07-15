import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiSalesUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class StoreCardChargeForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                comments: "",
                amount: 0.0,
                store_card:null,
            },
            modal:{
                title: "Cargo a monedero",
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
        if (this.state.id !== null) {
            axios.put(`${ApiSalesUrl}store_card_charges/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiSalesUrl}store_card_charges/`, this.state.data)
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
        let id = this.props.id?this.props.id:null;
        let store_card = this.props.store_card?this.props.store_card:null;
        this.reset(id);
        if (store_card){
            this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        store_card:store_card,
                    },
                };
            });
        }
        
	}

	componentDidUpdate(prevProps, prevState) {
        if(this.props.id !== this.state.id){
			this.reset(this.props.id);
		}
        if (this.props.store_card !== this.state.data.store_card) {
			this.setState(function (prev_State) {
                return {
                    data: {
                        ...prev_State.data,
                        store_card:this.props.store_card,
                    },
                };
            });
		}
	}

    reset(id){
        if (id !== null){
            axios.get(`${ApiSalesUrl}store_card_charges/${id}/`)
                .then(res => {
                    this.setState({
                        id:id,
                        data:res.data,
                    });
                });
        } else {
            this.setState({
                id:null,
                data:{
                    comments: "",
                    amount: 0.0,
                    store_card: null
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
        const { data,modal } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Monto</Label>
                                <Input type="number" 
                                    name="amount"  
                                    placeholder="Monto" 
                                    value={data.amount}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={12}>
                            <FormGroup>
                                <Label for="comments" size='sm'>Comentarios</Label>
                                <Input type="textarea" 
                                    name="comments"
                                    bsSize="sm" 
                                    placeholder="Comentarios" 
                                    value={data.comments}
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
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} handleCloseError={this.handleCloseError}  data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <StoreCardChargeForm {...props} params = {params} history={history} />;
}