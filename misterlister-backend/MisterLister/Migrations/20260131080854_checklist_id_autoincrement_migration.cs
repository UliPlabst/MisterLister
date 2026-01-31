using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MisterLister.Database;

#nullable disable

namespace MisterLister.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260131080854_checklist_id_autoincrement_migration")]
    public partial class checklist_id_autoincrement_migration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CheckLists_tmp",
                columns: table => new
                {
                    Key = table.Column<Guid>(type: "TEXT", nullable: false),
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: true),
                    Created = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastModified = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "TEXT", nullable: true),
                    Deleted = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeletedBy = table.Column<string>(type: "TEXT", nullable: true),
                    EncryptedKey = table.Column<string>(type: "TEXT", nullable: true),
                    RowVersion = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckLists", x => x.Id).Annotation("Sqlite:Autoincrement", true);
                    table.UniqueConstraint("AK_CheckLists_Key", x => x.Key);
                });
                
            migrationBuilder.Sql(
                @"INSERT INTO CheckLists_tmp 
                (Key, Id, Name, Description, CreatedBy, Created, LastModified, LastModifiedBy, Deleted, DeletedBy, EncryptedKey, RowVersion)
                SELECT Key, Id, Name, Description, CreatedBy, Created, LastModified, LastModifiedBy, Deleted, DeletedBy, EncryptedKey, RowVersion
                FROM CheckLists;"
            );
            
            migrationBuilder.DropTable(name: "CheckLists");
            
            migrationBuilder.RenameTable(name: "CheckLists_tmp", newName: "CheckLists");    
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
            => throw new NotImplementedException();
    }
}
