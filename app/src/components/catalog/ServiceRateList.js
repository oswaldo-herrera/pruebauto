import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CardTitle, CardSubtitle, Button, Row, Col, Card, CardImg, CardBody, Table, ButtonGroup, Form, FormGroup, Label, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ServiceRateForm from './ServiceRateForm';
class ServiceRateList extends Component{
    constructor(props){
        super(props);
        this.handleServiceRateEdit = this.handleServiceRateEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: null,
                service:null,
            },
            form:false,
            id:null
        }
    }

    addNewRate = (row) =>{
        this.setState({
            form:true,
            id:null,
        });
    }

    onChangeSearch(e) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: e.target.value,
                },
            };
        });
	};

    refreshList(){
        axios.get(`${ApiUrl}sales/service_rates/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let service = this.props.service?this.props.service:null;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    service: service,
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        let service = this.props.service?this.props.service:null;
        if (prevState.params.service !== this.props.service) {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        service: service,
                    },
                };
            });
		}
        if(this.checkParams(prevState.params,this.state.params)){
            this.refreshList();
        }
        
    }

    checkParams(prevParams, currentParams){
        return prevParams.search !== currentParams.search ||
            prevParams.ordering !== currentParams.ordering ||
            prevParams.service !== currentParams.service
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.start_date+"' de tarifa?")){
            axios.delete(`${ApiUrl}sales/service_rates/${row.id}/`)
                .then(res => {
                    this.refreshList();
                });
        }
    }

    onColumnClick = (field) => {
        if(this.state.params.ordering === field){
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: "-"+field
                    },
                };
            });
        } else {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: field
                    },
                };
            });
        }
    }

    sortTable = (field) => {
        if(this.state.params.ordering !== null){
            switch(this.state.params.ordering){
                case field:
                    return (<i className="bi bi-sort-alpha-down text-right"></i>)
                case "-"+field:
                    return (<i className="bi bi-sort-alpha-up text-right"></i>)
            }
        }
        return (<></>)
    }

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    handleServiceRateEdit = (event,id) => {
        this.setState({
            form:true,
            id:id,
        });
	}

    handleSave = () => {
        this.setState({
            form:false,
            id:null,
        });
        this.refreshList();
	}

    render(){
        const {data,id,form} = this.state;
        const {search,service} = this.state.params;
        return(
            <Row>
				<Col lg="2">
                    <Button className="btn" color="primary" size="sm" block onClick={(e)=> this.addNewRate()}>
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
                    <p id="before-table"></p>
                    <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"12%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("start_date")}>Periodo de inicio {this.sortTable("start_date")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("due_date")}>Periodo de fin {this.sortTable("due_date")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("currency")}>Moneda{this.sortTable("currency")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("adult_price")}>Tarifa adulto{this.sortTable("adult_price")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("child_price")}>Tarifa menor{this.sortTable("child_price")}</th>
                                <th width={"13%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{moment(row.start_date).format('LL')}</td>
                                    <td>{moment(row.due_date).format('LL')}</td>
                                    <td>{row.currency}</td>
                                    <td>{this.currencyFormat(row.adult_price)}</td>
                                    <td>{this.currencyFormat(row.child_price)}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Button color="info" size='sm' onClick={(e)=>{this.handleServiceRateEdit(e,row.id)}}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button color="warning" 
                                                size='sm'
                                                onClick={(e)=> this.onDeleteRow(row)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))} 
                        </tbody>
                    </Table>
				</Col>
                {form?
                <Col lg="12" className={"pt-3 border-top"}>
                    <ServiceRateForm handleSave={this.handleSave} service={service} id={id} />
                </Col>:<></>}
			</Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <ServiceRateList {...props} history={history} />;
}