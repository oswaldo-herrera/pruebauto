import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, ListGroup, ListGroupItem, Table } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalOperationDate extends Component{
	
    constructor(props){
        super(props);
        this.onChangeSelectOperation = this.onChangeSelectOperation.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state={
            open: false,
            operations:[],
        }
    }

    onChangeSelectOperation(i) {
        if(this.props.handleSelectOperation)
			this.props.handleSelectOperation(this.state.operations[i]);
    }

	componentDidMount() {
        let operations = this.props.data.operations?this.props.data.operations:this.state.operations;
        let open = this.props.data.open!==undefined?this.props.data.open:this.state.open;
        this.setState({
            operations:operations,
            open:open,
        });
	}

	componentDidUpdate(prevProps, prevState) {
        let operations = this.props.data.operations?this.props.data.operations:this.state.operations;
        let open = this.props.data.open!==undefined?this.props.data.open:this.state.open;
        if(prevState.open!==open||prevState.operations!==operations)
            this.setState({
                operations:operations,
                open:open,
            });
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	render(){
		const { open,operations } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}
                toggle={this.handleClose}>
				<ModalHeader className="text-center" toggle={this.handleClose}>Operaciones</ModalHeader>
				<ModalBody>
                    <Table size='sm'
                        hover
                        responsive>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Adultos</th>
                                <th>Menores</th>
                            </tr>
                        </thead>
                        <tbody>
                        {operations.map((operation, index) => (
                            <tr onClick={()=>{this.onChangeSelectOperation(index)}}>
                                <td>
                                    {moment(operation.date).format('DD/MM/YYYY')}
                                </td>
                                <td>
                                    {operation.transfer_type}
                                </td>
                                <td>
                                    {Math.round(operation.adults_total)}
                                </td>
                                <td>
                                    {Math.round(operation.childs_total)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
				</ModalBody>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalOperationDate {...props} history={history} />;
}