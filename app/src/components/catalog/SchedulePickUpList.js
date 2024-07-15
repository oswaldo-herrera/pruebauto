import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CardTitle, CardSubtitle, Button, Row, Col, Card, CardImg, CardBody, Table, ButtonGroup, Form, FormGroup, Label, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import SchedulePickUpForm from './SchedulePickUpForm';
class SchedulePickUpList extends Component{
    constructor(props){
        super(props);
        this.handleSchedulePickUpEdit = this.handleSchedulePickUpEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: null,
                schedule:null,
            },
            schedule_title:null,
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
        axios.get(`${ApiUrl}sales/schedule_pickups/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let schedule = this.props.schedule?this.props.schedule:null;
        let schedule_title = this.props.schedule_title?this.props.schedule_title:null;
        let clone = this.props.clone?this.props.clone:null;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    schedule: schedule,
                },
                schedule_title:schedule_title,
                clone:clone
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        let schedule = this.props.schedule?this.props.schedule:null;
        let schedule_title = this.props.schedule_title?this.props.schedule_title:null;
        let clone = this.props.clone?this.props.clone:null;
        if (prevState.params.schedule !== this.props.schedule) {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        schedule: schedule,
                    },
                    schedule_title:schedule_title,
                    clone:clone
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
            prevParams.schedule !== currentParams.schedule
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.start_date+"' de disponilibidad?")){
            axios.delete(`${ApiUrl}sales/schedule_pickups/${row.id}/`)
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

    handleSchedulePickUpEdit = (event,id) => {
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
        const {data,id,form,schedule_title,clone} = this.state;
        const {search,schedule} = this.state.params;
        return(
            <Row className='border-top pt-3'>
                <Col lg={12}>
                    <h4>Pick Ups {schedule_title?schedule_title:""}</h4>
                </Col>
				<Col lg="2">
                    {clone !== null?<></>:
                    <Button className="btn" color="primary" size="sm" block onClick={(e)=> this.addNewRate()}>
						<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
					</Button>}
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
                                <th width={"5%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                                <th width={"50%"} onClick={(e)=> this.onColumnClick("hotel")}>Hotel {this.sortTable("hotel")}</th>
                                <th width={"25%"} onClick={(e)=> this.onColumnClick("time")}>Pick Up {this.sortTable("time")}</th>
                                <th width={"10%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.hotel_name}</td>
                                    <td>{row.time}</td>
                                    <td className='text-center'>
                                        {clone !== null?<></>:
                                        <ButtonGroup>
                                            <Button color="info" size='sm' onClick={(e)=>{this.handleSchedulePickUpEdit(e,row.id)}}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button color="warning" 
                                                size='sm'
                                                onClick={(e)=> this.onDeleteRow(row)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </ButtonGroup>}
                                    </td>
                                </tr>
                            ))} 
                        </tbody>
                    </Table>
				</Col>
                {form?
                <Col lg="12" className={"pt-3 border-top"}>
                    <SchedulePickUpForm handleSave={this.handleSave} schedule={schedule} id={id} />
                </Col>:<></>}
			</Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <SchedulePickUpList {...props} history={history} />;
}