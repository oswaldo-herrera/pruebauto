import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Col, Row, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import { getAllUserExtensions, deleteUserExtension, deactivateUserExtension } from './UserModel';
import axios from "axios";
import moment from 'moment';
class UserList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
            }
        }
        this.refreshList();
    }

    refreshList(){
        getAllUserExtensions(this.state.params).then((result) =>{
            this.setState({
                data:result
            });
        });
    };

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

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.user.username+"' de usuarios?")){
            deleteUserExtension(row.id).then(res => {
                this.refreshList();
            });
        }
    }

    onDeactivateUserRow = (row) =>{
        if(window.confirm("¿Desea deshabilitar al usuario '"+row.user.username+"'?")){
            deactivateUserExtension(row.id).then(res => {
                this.refreshList();
            }).catch(error => {
                window.alert(error.response.data.user)
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

    render(){
        const {data,params} = this.state;
        return(
        <Row>
            <Col lg="4">
                <h4>Usuarios del sistema <i className="bi bi-person-fill"></i></h4>
            </Col>
            <Col lg="1">
                <Link to={"/user_extension/"}>
                    <Button className="btn" color="primary" size="sm" block>
                        <h5 className='mb-0'><i className="bi bi-plus"></i></h5>
                    </Button>
                </Link>
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
                            <th width={"15%"} onClick={(e)=> this.onColumnClick("user__username")}>Nombre de usuario {this.sortTable("user__username")}</th>
                            <th width={"13%"} onClick={(e)=> this.onColumnClick("user__email")}>Correo {this.sortTable("user__email")}</th>
                            <th width={"13%"} onClick={(e)=> this.onColumnClick("user__first_name")}>Nombre {this.sortTable("user__first_name")}</th>
                            <th width={"13%"} onClick={(e)=> this.onColumnClick("user__last_name")}>Apellido{this.sortTable("user__last_name")}</th>
                            <th width={"15%"}>Grupo de permiso</th>
                            <th width={"12%"}>Propiedades</th>
                            <th width={"13%"}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr scope="row" key={row.id}>
                                <td>{row.id}</td>
                                <td>
                                    {row.user.username} 
                                    {row.user.is_superuser?<i className="bi bi-award-fill text-right"></i>:<></>} 
                                    {!row.user.is_active?<i className="bi bi-person-fill-slash text-right"></i>:<></>}
                                </td>
                                <td>{row.user.email}</td>
                                <td>{row.user.first_name}</td>
                                <td>{row.user.last_name}</td>
                                <td>{row.permission_group_name}</td>
                                <td>{row.properties.map((property)=>property.name).join(',')}</td>
                                <td className='text-center'>
                                    <ButtonGroup>
                                        <Link to={`/user_extension/${row.id}`}>
                                            <Button color="info"
                                                size='sm'>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                        </Link>
                                        <Button color="warning" 
                                            size='sm'
                                            onClick={(e)=> this.onDeactivateUserRow(row)}>
                                            <i className="bi bi-person-fill-down"></i>
                                        </Button>
                                        <Button color="danger" 
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
        </Row>)
    }
}
export default function(props) {
    const history = useNavigate();
    return <UserList {...props} history={history} />;
}