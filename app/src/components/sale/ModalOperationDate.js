import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, ListGroup, ListGroupItem, Table } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
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

    handleOperationPrint = (operation) => {
        var url = `${ApiSalesUrl}operation_report_list/?date=${operation.date}&service=${operation.service.id}&property=${operation.property.id}`;
        window.open(url, "_blank");
	}

	render(){
		const { open,operations } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
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
                                <th>Grupo</th>
                                <th>Nombre</th>
                                <th>Hora</th>
                                <th>Pax</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        {operations.map((operation, index) => (
                            <tr onClick={()=>{this.onChangeSelectOperation(index)}}>
                                <td>
                                    {moment(operation.date).format('DD/MM/YYYY')}
                                </td>
                                <td>
                                    {operation.service.availability_group_name}
                                </td>
                                <td>
                                    {operation.service.name}
                                </td>
                                <td>{moment(operation.time, "HH:mm:ss").format('HH:mm')}</td>
                                <td>
                                    {Math.round(operation.pax_total)}
                                </td>
                                <td>
                                    <Button color="info"
                                        size='sm'
                                        onClick={(e)=> this.handleOperationPrint(operation)}>
                                        <i className="bi bi-filetype-pdf"></i>
                                    </Button>
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