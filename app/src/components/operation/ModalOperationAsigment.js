import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, ListGroup, ListGroupItem, Table, InputGroup, List } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalOperationAsigment extends Component{
	
    constructor(props){
        super(props);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleAsignment = this.handleAsignment.bind(this);
        this.state={
            reservation_services:[],
            reasigment:false,
            property:null,
        }
    }

    onChangeValue(event) {
		this.setState({
			reasigment:event.target.checked,
		});
    }

	isDataChange(prev_data, new_data){
        if(prev_data.reasigment !== new_data.reasigment)
			return true;
        if(prev_data.reservation_services.length !== new_data.reservation_services.length)
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
        this.setState({
            reasigment:data.reasigment,
            reservation_services:data.reservation_services,
        });
    }

    unset_unit_last_asignment(){
        let reservation_services = this.state.reservation_services.map((reservation_service)=>reservation_service.id)
        axios.put(`${ApiOperationsUrl}operations_unset_unit_asignment/`,
            {
                reasigment:this.state.reasigment,
                reservation_services:reservation_services
            }
        ).then(res => {
            if(this.props.handleAsignment)
			    this.props.handleAsignment();
        });
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

    handleAsignment = (event) => {
        this.unset_unit_last_asignment()		
	}

	render(){
		const { reservation_services, reasigment, } = this.state;
		return(
			<Modal
				isOpen={reservation_services.length > 0}
				backdrop="static"
				keyboard={false}
                toggle={this.handleClose}>
				<ModalHeader className="text-center" toggle={this.handleClose}>Desasignacion de unidades</ModalHeader>
				<ModalBody>
                    <Row>
                        <Col>
                            <FormGroup switch>
                                <Input type="switch" 
                                    name="reasigment"
                                    checked={reasigment}
                                    onChange={this.onChangeValue}/>
                                <Label check>¿Reasignar unidad?</Label>
                            </FormGroup>
                        </Col>
                        {reservation_services.length > 0?<>
                        <Col sm={12}>
                            <h6>Reservaciones:</h6>
                            <List>
                            {reservation_services.map((reservation_service, index) => (
                                <li>{reservation_service.reference.toString().padStart(6, '0')} {reservation_service.unit!==null?" - "+reservation_service.unit_code+(reservation_service.number>0?"-"+reservation_service.number:""):""} </li>
                            ))} 
                            </List>
                        </Col>
                        </>:<></>}
                    </Row>
				</ModalBody>
                <ModalFooter>
                    <ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" onClick={this.handleAsignment}>
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
    return <ModalOperationAsigment {...props} history={history} />;
}