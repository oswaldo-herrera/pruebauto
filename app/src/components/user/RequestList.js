import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Col, Row, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import { getAllUserExtensions, deleteUserExtension, deactivateUserExtension } from './UserModel';
import axios from "axios";
import moment from 'moment';
import ModalBodyRequest from './ModalBodyRequest';
class RequestList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                limit: 100,
                ordering: "-date",
            },
            modal_body:{
                show:false,
                body:null,
                response:null
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}general/requests/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let user = this.props.user?this.props.user:"";
        if(user != ""){
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        user: user
                    },
                };
            });
        } else {
            this.refreshList();
        }
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onChangeSearch(e) {
        this.setState(function (prev_State) {
            return {
                params: {
                    ...prev_State.params,
                    search: e.target.value,
                },
            };
        });
	};

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

    onShowBodyRequest = (event,row) => {
        if(row.body_request !== ""){
            this.setState(function (prev_State) {
                return {
                    modal_body: {
                        ...prev_State.modal_body,
                        show: true,
                        body:row.body_request,
                    },
                };
            });
        }
	}

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_body: {
                    ...prev_State.modal_body,
                    show: false,
                },
            };
        });
	}

    render(){
        const {data,params, modal_body} = this.state;
        return(
        <Row>
            <Col lg="4">
                <h4>Consultas al api <i className="bi bi-server"></i></h4>
            </Col>
            <Col></Col>
            <Col lg="4">
                <Input
                    bsSize="sm"
                    name="search"
                    placeholder="Busqueda"
                    type="search"
                    value={params.search}
                    onChange={this.onChangeSearch.bind(this)}/>
            </Col>
            <Col lg="12">
                <Table size='sm' className="no-wrap align-middle" responsive striped bordered>
                    <thead>
                        <tr>
                            <th width={"6%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                            <th width={"20%"} onClick={(e)=> this.onColumnClick("endpoint")}>Endpoint {this.sortTable("endpoint")}</th>
                            <th width={"18%"} onClick={(e)=> this.onColumnClick("user__username")}>Nombre de usuario {this.sortTable("user__username")}</th>
                            <th width={"18%"} onClick={(e)=> this.onColumnClick("response_code")}>Codigo Respuesta {this.sortTable("response_code")}</th>
                            <th width={"18%"} onClick={(e)=> this.onColumnClick("method")}>Metodo {this.sortTable("method")}</th>
                            <th width={"20%"} onClick={(e)=> this.onColumnClick("date")}>Fecha {this.sortTable("date")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr scope="row" key={row.id}>
                                <td>{row.id}</td>
                                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.endpoint}</td>
                                <td>
                                    {row.user?row.user.username:"Anonimo"} 
                                </td>
                                <td>{row.response_code}</td>
                                <td>{row.method}</td>
                                <td>{moment(row.date).format('MMMM Do YYYY, h:mm:ss a')}</td>
                            </tr>
                        ))} 
                    </tbody>
              </Table>
            </Col>
            <ModalBodyRequest handleClose={this.handleClose} data={modal_body} />
        </Row>)
    }
}
export default function(props) {
    const history = useNavigate();
    return <RequestList {...props} history={history} />;
}