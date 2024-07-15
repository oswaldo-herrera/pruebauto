import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../../constants/api/site';
class ModalOperationOperaInformationReservation extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueRadioHotel = this.onChangeValueRadioHotel.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:true,
            params:{
                opera_code:"",
            },
            user_extension:null,
            requestActive:false,
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
		},()=>{
            this.reset(this.state,this.props.open);
        }); 
    }

    onChangeValueRadioHotel(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    domain:event.target.value,
                },
            };
        },()=>{
            this.reset(this.state,this.props.open);
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
        if(prev_data.user_extension !== new_data.user_extension)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
        let open = this.props.open;
		this.reset(data,open);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)||prevProps.open !== this.props.open) {
			this.reset(this.props.data,this.props.open);
		}
	}

	reset(data,open){
        let user_extension = data.user_extension!==undefined?data.user_extension:this.state.user_extension;
        this.setState(
            (prev_State) =>{
                return {
                    ...prev_State,
                    open: open,
                    user_extension: user_extension,
                };
            }
        );
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
        this.setState({
			requestActive: true,
		});
        axios.get(`${ApiOperationsUrl}reservation_token/opera/?opera_code=${this.state.params.opera_code}&user=${this.state.user_extension}`)
        .then(res => {
            if(this.props.handleSave&&res.data.success)
			    this.props.handleSave(res.data.reservation,res.data.reservation_service_data);
        }).catch(error => {
            alert(error.response.data.error)
        }).finally(()=>this.setState({
            requestActive: false,
        }));
	}
    
	render(){
		const { params, open, requestActive } = this.state;
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
                size='sm'
				keyboard={false}>
				<ModalHeader className="text-center">Importar de OPERA</ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-opera-form">
                        <Row>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Reserva opera
                                    </Label>
                                    <Input type='text'
                                        name="opera_code"
                                        value={params.opera_code}
                                        required
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
						<Button color="success" type="submit" form='filter-opera-form' disabled={requestActive}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
        </>)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalOperationOperaInformationReservation {...props} history={history} />;
}